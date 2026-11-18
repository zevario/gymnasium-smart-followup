"""Jalankan dari folder ai/:  python -m unittest tests/test_ml.py -v   (setelah src/train.py)"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402

from api.app import app  # noqa: E402

client = TestClient(app)

# Customer B di docs/aturan_label.md bagian 7 (0 poin -> Low): rajin, responsif, paket masih panjang.
LOW = {"customerId": "B", "visits30Days": 6, "daysSinceLastVisit": 2, "attendanceRatio": 0.95,
       "reschedules": 0, "noResponses": 0, "responseRatio": 0.9, "remainingSessions": 5,
       "daysToExpiry": 30}
# Customer A (14 poin -> High): tidak aktif, jarang membalas, sesi akan hangus dalam 5 hari.
HIGH = {"customerId": "A", "visits30Days": 0, "daysSinceLastVisit": 20, "attendanceRatio": 0.5,
        "reschedules": 3, "noResponses": 4, "responseRatio": 0.2, "remainingSessions": 3,
        "daysToExpiry": 5}


def predict(*customers):
    return client.post("/predict", json={"customers": list(customers)})


class TestBackendContract(unittest.TestCase):
    """Bentuk yang diperiksa askModel() di backend/src/modules/predictions/prediction.service.js."""

    def test_health(self):
        body = client.get("/health").json()
        self.assertEqual(body["status"], "ok")
        self.assertEqual(len(body["features"]), 8)
        self.assertTrue(body["modelVersion"])

    def test_response_shape_matches_backend(self):
        body = predict(LOW, HIGH).json()
        self.assertTrue(body["modelVersion"])
        self.assertEqual(len(body["predictions"]), 2)
        for p in body["predictions"]:
            self.assertIn(p["priority"], {"low", "medium", "high"})
            self.assertTrue(0 <= p["score"] <= 1)
            self.assertEqual(p["score"], p["probabilities"][p["priority"]])

    def test_doc_examples(self):
        low, high = predict(LOW, HIGH).json()["predictions"]
        self.assertEqual(low["priority"], "low")
        self.assertEqual(high["priority"], "high")

    def test_backend_nulls_allowed(self):
        # Customer baru: belum pernah hadir, belum ada reminder, belum punya paket aktif.
        new = {"customerId": "N", "visits30Days": 0, "daysSinceLastVisit": None, "attendanceRatio": None,
               "reschedules": 0, "noResponses": 0, "responseRatio": None, "remainingSessions": None,
               "daysToExpiry": None}
        r = predict(new)
        self.assertEqual(r.status_code, 200)
        self.assertIn(r.json()["predictions"][0]["priority"], {"low", "medium", "high"})

    def test_unknown_columns_ignored(self):
        self.assertEqual(predict({**LOW, "extraColumn": 1}).status_code, 200)

    def test_rejects_invalid_input(self):
        self.assertEqual(predict({**LOW, "visits30Days": -1}).status_code, 422)
        self.assertEqual(predict({**LOW, "responseRatio": 1.5}).status_code, 422)
        self.assertEqual(predict({k: v for k, v in LOW.items() if k != "noResponses"}).status_code, 422)
        self.assertEqual(client.post("/predict", json={"customers": []}).status_code, 422)

    def test_rejects_duplicate_ids(self):
        self.assertEqual(predict(LOW, {**HIGH, "customerId": "B"}).status_code, 422)

    def test_batch_keeps_order(self):
        ids = [p["customerId"] for p in predict(*[{**LOW, "customerId": str(i)} for i in range(5)])
               .json()["predictions"]]
        self.assertEqual(ids, [str(i) for i in range(5)])


if __name__ == "__main__":
    unittest.main()
