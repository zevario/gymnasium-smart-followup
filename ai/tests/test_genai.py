"""Jalankan dari folder ai/:  python -m unittest tests/test_genai.py -v

Gemini disimulasikan dengan mock, jadi tes tidak butuh internet atau kunci API.
"""
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402

from api import genai  # noqa: E402
from api.app import app  # noqa: E402

client = TestClient(app)

SCHEDULE = genai.DraftRequest(kind="schedule_reminder", customerName="Rina Pramesti", priority="high",
                              className="Group Class Regular",
                              classStartsAt="2026-11-20T08:00:00+07:00")
PACKAGE = genai.DraftRequest(kind="package_reminder", customerName="Dimas Saputra",
                             packageName="Open Gym 4 Sesi", remainingSessions=2, expiresAt="2026-11-24")
GOOD = ("Halo Kak Rina, kami dari Gymnasyum Bintaro. Mengingatkan kelas Group Class Regular "
        "besok, Jumat, 20 November 2026 pukul 08.00 WIB. Apakah Kakak bisa hadir?")


class TestDraft(unittest.TestCase):
    def setUp(self):
        genai._generate.cache_clear()

    def run_with(self, req, reply=None, error=None):
        with patch.dict(os.environ, {"GEMINI_API_KEY": "kunci-uji"}), \
                patch.object(genai, "call_gemini", side_effect=error, return_value=reply) as mock:
            return genai.draft(req), mock

    def test_without_key_uses_template_with_facts(self):
        with patch.dict(os.environ, {"GEMINI_API_KEY": ""}):
            out = genai.draft(SCHEDULE)
        self.assertEqual(out["source"], "template")
        self.assertIn("Rina Pramesti", out["message"])
        self.assertIn("Jumat, 20 November 2026 pukul 08.00 WIB", out["message"])

    def test_valid_gemini_draft_is_used(self):
        out, _ = self.run_with(SCHEDULE, GOOD)
        self.assertEqual(out["source"], "gemini")
        self.assertEqual(out["message"], GOOD)

    def test_invented_number_falls_back(self):
        out, _ = self.run_with(SCHEDULE, GOOD.replace("08.00", "09.30"))
        self.assertEqual(out["source"], "template")
        self.assertIn("angka di luar fakta", out["reason"])

    def test_price_or_promo_falls_back(self):
        out, _ = self.run_with(SCHEDULE, GOOD + " Ada promo spesial untuk Kakak.")
        self.assertEqual(out["source"], "template")

    def test_missing_name_falls_back(self):
        out, _ = self.run_with(SCHEDULE, "Halo Kak, jangan lupa kelas besok ya.")
        self.assertIn("nama customer", out["reason"])

    def test_relative_time_falls_back(self):
        trial = genai.DraftRequest(kind="followup_trial", customerName="Nadia Putri",
                                   trialDate="2026-11-14")
        out, _ = self.run_with(trial, "Halo Kak Nadia, bagaimana latihan kemarin?")
        self.assertIn("waktu relatif", out["reason"])
        genai._generate.cache_clear()
        out, _ = self.run_with(trial, "Halo Kak Nadia, sampai jumpa besok ya.")
        self.assertIn("waktu relatif", out["reason"])
        genai._generate.cache_clear()
        out, _ = self.run_with(SCHEDULE, GOOD)   # 'besok' boleh untuk pengingat jadwal
        self.assertEqual(out["source"], "gemini")

    def test_one_repair_attempt_after_rejection(self):
        bad = GOOD.replace("08.00", "09.30")
        with patch.dict(os.environ, {"GEMINI_API_KEY": "kunci-uji"}), \
                patch.object(genai, "call_gemini", side_effect=[bad, GOOD]) as mock:
            out = genai.draft(SCHEDULE)
        self.assertEqual((out["source"], mock.call_count), ("gemini", 2))
        self.assertIn("ditolak karena angka di luar fakta", mock.call_args.args[0])

    def test_gemini_error_falls_back(self):
        out, _ = self.run_with(PACKAGE, error=TimeoutError("lambat"))
        self.assertEqual(out["source"], "template")
        self.assertIn("2 sesi", out["message"])
        self.assertIn("Selasa, 24 November 2026", out["message"])

    def test_same_request_is_cached(self):
        with patch.dict(os.environ, {"GEMINI_API_KEY": "kunci-uji"}), \
                patch.object(genai, "call_gemini", return_value=GOOD) as mock:
            genai.draft(SCHEDULE)
            genai.draft(SCHEDULE)
        self.assertEqual(mock.call_count, 1)

    def test_relative_word_right_after_date_is_removed(self):
        trial = genai.DraftRequest(kind="followup_trial", customerName="Lina Marlina",
                                   trialDate="2026-11-17")
        out, _ = self.run_with(trial, "Halo Kak Lina, terima kasih sudah mencoba trial pada "
                                      "Selasa, 17 November 2026 kemarin. Bagaimana latihannya?")
        self.assertEqual(out["source"], "gemini")
        self.assertIn("17 November 2026. Bagaimana", out["message"])

    def test_template_fallback_is_not_cached(self):
        self.run_with(PACKAGE, error=TimeoutError("lambat"))
        reply = ("Halo Kak Dimas, paket Open Gym 4 Sesi masih ada 2 sesi dan berakhir pada "
                 "Selasa, 24 November 2026. Mau kami bantu jadwalkan?")
        out, mock = self.run_with(PACKAGE, reply)   # "Buat ulang" harus mencoba Gemini lagi
        self.assertEqual((out["source"], mock.call_count), ("gemini", 1))

    def test_prompt_contains_only_given_facts(self):
        prompt = genai.build_prompt(PACKAGE)
        self.assertIn("sisa sesi: 2 sesi", prompt)
        self.assertNotIn("kelas", prompt.split("Fakta:")[1])

    def test_expired_package_is_not_called_upcoming(self):
        req = genai.DraftRequest(kind="followup_renewal", customerName="Joko Susilo",
                                 packageName="Open Gym 4 Sesi", expiresAt="2020-01-10")
        self.assertIn("sudah berakhir pada", genai.template(req))
        out, _ = self.run_with(req, "Halo Kak Joko, paket Open Gym 4 Sesi akan berakhir pada "
                                    "Jumat, 10 Januari 2020. Mau dibantu melanjutkan?")
        self.assertEqual(out["source"], "template")

    def test_every_kind_has_a_template(self):
        for kind in ("schedule_reminder", "package_reminder", "followup_trial", "followup_renewal"):
            req = genai.DraftRequest(kind=kind, customerName="Sari")
            message = genai.template(req)
            self.assertIsNone(genai.check(message, req), kind)


class TestDraftEndpoint(unittest.TestCase):
    def setUp(self):
        genai._generate.cache_clear()

    def test_endpoint_returns_message(self):
        with patch.dict(os.environ, {"GEMINI_API_KEY": ""}):
            body = client.post("/draft", json=PACKAGE.model_dump(mode="json")).json()
        self.assertEqual(set(body), {"message", "source", "model", "reason"})
        self.assertLessEqual(len(body["message"]), 500)

    def test_endpoint_rejects_unknown_kind(self):
        self.assertEqual(client.post("/draft", json={"kind": "promo", "customerName": "A"}).status_code, 422)

    def test_health_reports_draft_status(self):
        self.assertIn("configured", client.get("/health").json()["draft"])


if __name__ == "__main__":
    unittest.main()
