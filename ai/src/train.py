"""EDA, baseline, pelatihan & evaluasi model prioritas follow-up.

Jalankan dari folder ai/:  python src/train.py
Input : data/raw/priority_dataset.csv (+ priority_dataset_debug.csv untuk label_rule)
Sejak v0.5 fitur = 8 kolom yang dikirim backend website (nama camelCase yang sama).
Output: models/priority_model.joblib, models/metrics.json, docs/eda.md, docs/evaluasi_model.md
"""
import hashlib
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, classification_report, confusion_matrix, f1_score, make_scorer,
                             recall_score)
from sklearn.model_selection import StratifiedGroupKFold, cross_validate
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "raw" / "priority_dataset.csv"
DEBUG = ROOT / "data" / "raw" / "priority_dataset_debug.csv"
MODEL_PATH = ROOT / "models" / "priority_model.joblib"
DOCS = ROOT / "docs"
SEED = 42
LABELS = ["Low", "Medium", "High"]

# Sejak v0.5 fitur = 8 kolom yang dikirim backend (prediction.repository.js collectFeatures),
# dengan nama yang sama persis, sehingga backend tidak perlu mengubah apa pun.
NUMERIC = [
    "visits30Days", "daysSinceLastVisit", "attendanceRatio", "reschedules",
    "noResponses", "responseRatio", "remainingSessions", "daysToExpiry",
]
FEATURES = NUMERIC  # sesuai docs/aturan_label.md bagian 3


def backend_rule_priority(df: pd.DataFrame) -> pd.Series:
    """Baseline 'cara sederhana' = baselinePriority() di backend/src/modules/predictions/
    prediction.service.js, yang juga dipakai backend saat Inference API tidak tersedia.
    Dihitung langsung dari 8 fitur yang sama dengan model (nilai kosong diperlakukan seperti null)."""
    def one(r):
        exp = None if pd.isna(r.daysToExpiry) else r.daysToExpiry
        idle = None if pd.isna(r.daysSinceLastVisit) else r.daysSinceLastVisit
        if (exp is not None and exp <= 3) or (idle is not None and idle >= 30) or r.noResponses >= 2:
            return "High"
        if ((exp is not None and exp <= 14) or (idle is not None and idle >= 14)
                or r.noResponses == 1 or r.visits30Days <= 1):
            return "Medium"
        return "Low"

    return df.apply(one, axis=1)


def metrics(y_true, y_pred) -> dict:
    return {
        "accuracy": round(accuracy_score(y_true, y_pred), 4),
        "macro_f1": round(f1_score(y_true, y_pred, average="macro"), 4),
        "recall_high": round(recall_score(y_true, y_pred, labels=["High"], average="macro"), 4),
    }


def group_split(df: pd.DataFrame, n_splits: int):
    """Satu fold StratifiedGroupKFold: customer yang sama tidak pernah ada di dua sisi."""
    cv = StratifiedGroupKFold(n_splits=n_splits, shuffle=True, random_state=SEED)
    rest, hold = next(cv.split(df, df["label"], groups=df["customer_id"]))
    return df.iloc[rest].reset_index(drop=True), df.iloc[hold].reset_index(drop=True)


def pipe(clf, scale=False):
    # Median & indikator missing di-fit hanya pada train (aturan label: data kosong diisi median).
    num_steps = [("impute", SimpleImputer(strategy="median", add_indicator=True))]
    if scale:
        num_steps.append(("scale", StandardScaler()))
    pre = ColumnTransformer([("num", Pipeline(num_steps), NUMERIC)])
    return Pipeline([("pre", pre), ("clf", clf)])


def bootstrap_ci(test: pd.DataFrame, pred: np.ndarray, n: int = 1000) -> dict:
    """95% CI dengan resampling per customer (baris satu customer saling berkaitan)."""
    rng = np.random.default_rng(SEED)
    rows_of = test.groupby("customer_id").indices
    ids = list(rows_of)
    y = test["label"].to_numpy()
    stats = []
    for _ in range(n):
        rows = np.concatenate([rows_of[c] for c in rng.choice(ids, len(ids))])
        stats.append(metrics(y[rows], pred[rows]))
    s = pd.DataFrame(stats)
    return {k: [round(s[k].quantile(0.025), 3), round(s[k].quantile(0.975), 3)] for k in s}


def build_candidates() -> dict:
    return {
        "logistic_regression": pipe(LogisticRegression(max_iter=3000, class_weight="balanced"), True),
        "random_forest": pipe(RandomForestClassifier(n_estimators=300, min_samples_leaf=3,
                                                     class_weight="balanced", random_state=SEED), False),
        "hist_gradient_boosting": pipe(HistGradientBoostingClassifier(class_weight="balanced",
                                                                      random_state=SEED), False),
    }


def write_eda(df: pd.DataFrame) -> None:
    lines = [
        "# EDA priority_dataset.csv", "",
        f"Baris: {len(df)} | customer unik: {df['customer_id'].nunique()} | "
        f"baris per customer: {df.groupby('customer_id').size().min()}–{df.groupby('customer_id').size().max()}", "",
        "## Distribusi kelas", "",
        df["label"].value_counts().to_frame("jumlah").assign(
            proporsi=df["label"].value_counts(normalize=True).round(3)).to_markdown(), "",
        "## Nilai kosong", "", df[NUMERIC].isna().sum().to_frame("kosong").to_markdown(), "",
        "## Rata-rata fitur per kelas", "",
        df.groupby("label")[NUMERIC].mean().round(2).T[LABELS].to_markdown(), "",
        "## Distribusi kelas per kategori paket aktif (metadata, bukan fitur)", "",
        pd.crosstab(df["package_category"].fillna("tanpa paket aktif"), df["label"],
                    normalize="index").round(2)[LABELS].to_markdown(), "",
    ]
    (DOCS / "eda.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    MODEL_PATH.parent.mkdir(exist_ok=True)
    df = pd.read_csv(DATA)
    rule = pd.read_csv(DEBUG)[["customer_id", "reference_date", "label_rule"]]
    df = df.merge(rule, on=["customer_id", "reference_date"], how="left", validate="one_to_one")
    write_eda(df)

    # Test 15% per customer dipisah SEBELUM preprocessing dan hanya dipakai sekali di akhir.
    train_val, test = group_split(df, n_splits=7)
    assert not set(train_val["customer_id"]) & set(test["customer_id"])
    X, y = train_val[FEATURES], train_val["label"]

    # Pemilihan model: 5-fold CV per customer pada 85% sisanya (lebih stabil daripada satu set validation).
    cv = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=SEED)
    scoring = {"accuracy": "accuracy", "macro_f1": "f1_macro",
               "recall_high": make_scorer(recall_score, labels=["High"], average="macro")}
    results = {"split": {"train_val": len(train_val), "test": len(test)}, "cv": {}}
    candidates = build_candidates()
    for name, model in candidates.items():
        s = cross_validate(model, X, y, groups=train_val["customer_id"], cv=cv, scoring=scoring)
        results["cv"][name] = {k: f"{s[f'test_{k}'].mean():.3f} ± {s[f'test_{k}'].std():.3f}" for k in scoring}
        results["cv"][name]["_macro_f1_mean"] = s["test_macro_f1"].mean()
    best_name = max(results["cv"], key=lambda n: results["cv"][n]["_macro_f1_mean"])
    for v in results["cv"].values():
        v.pop("_macro_f1_mean")
    best = candidates[best_name].fit(X, y)  # model akhir dilatih ulang dengan seluruh 85% data

    y_test = test["label"]
    test_pred = best.predict(test[FEATURES])
    majority = DummyClassifier(strategy="most_frequent").fit(X, y)
    # Baseline jujur: pohon keputusan 2 tingkat (paling banyak 4 aturan if-else) dengan fitur yang sama.
    tree2 = pipe(DecisionTreeClassifier(max_depth=2, class_weight="balanced", random_state=SEED)).fit(X, y)
    results["best_model"] = best_name
    results["test"] = {
        "baseline_majority_class": metrics(y_test, majority.predict(test[FEATURES])),
        "baseline_backend_rule": metrics(y_test, backend_rule_priority(test)),
        "baseline_decision_tree_depth2": metrics(y_test, tree2.predict(test[FEATURES])),
        best_name: metrics(y_test, test_pred),
        "reference_label_rule_ceiling": metrics(y_test, test["label_rule"]),
    }
    results["test_ci95"] = bootstrap_ci(test, test_pred)
    ceiling = results["test"]["reference_label_rule_ceiling"]["accuracy"]
    results["share_of_ceiling"] = round(results["test"][best_name]["accuracy"] / ceiling, 3)
    results["target_75pct_met"] = results["test"][best_name]["accuracy"] >= 0.75

    imp = permutation_importance(best, test[FEATURES], y_test, scoring="f1_macro",
                                 n_repeats=10, random_state=SEED)
    importance = pd.Series(imp.importances_mean, index=FEATURES).sort_values(ascending=False).round(4)
    cm = pd.DataFrame(confusion_matrix(y_test, test_pred, labels=LABELS),
                      index=[f"asli {l}" for l in LABELS], columns=[f"prediksi {l}" for l in LABELS])

    report = [
        "# Evaluasi model prioritas follow-up", "",
        "Dibuat otomatis oleh `src/train.py`.", "",
        f"Split per customer (StratifiedGroupKFold): train+val {len(train_val)} / test {len(test)} baris. "
        "Tidak ada customer yang muncul di train dan test sekaligus.", "",
        "## Pemilihan model (5-fold CV per customer, rata-rata ± std)", "",
        pd.DataFrame(results["cv"]).T.to_markdown(), "",
        f"Model terpilih (macro F1 CV tertinggi): **{best_name}**, lalu dilatih ulang dengan seluruh train+val.", "",
        "## Hasil test set vs baseline", "",
        pd.DataFrame(results["test"]).T.to_markdown(), "",
        f"95% CI model (bootstrap per customer, 1000x): " + ", ".join(
            f"{k} {lo}–{hi}" for k, (lo, hi) in results["test_ci95"].items()), "",
        "- `baseline_backend_rule`: `baselinePriority()` di backend tim (`prediction.service.js`), "
        "yang juga dipakai backend bila Inference API tidak tersedia. Ditampilkan sebagai kondisi saat ini.",
        "- `baseline_decision_tree_depth2`: baseline sederhana yang jujur, maksimal 4 aturan if-else.",
        "- `reference_label_rule_ceiling`: aturan poin itu sendiri (sebelum 5–8% label digeser). "
        "Bukan baseline, melainkan batas atas yang realistis, karena label = aturan + noise.", "",
        f"**Akurasi model = {results['share_of_ceiling']:.0%} dari batas atas.** Karena label dibuat dari aturan "
        "poin tim, angka ini mengukur seberapa baik model meniru aturan tersebut, bukan perilaku customer nyata.", "",
        f"Target akurasi >= 75%: **{'TERCAPAI' if results['target_75pct_met'] else 'BELUM'}**", "",
        "## Classification report (test)", "", "```",
        classification_report(y_test, test_pred, labels=LABELS), "```", "",
        "## Confusion matrix (test)", "", cm.to_markdown(), "",
        "## Permutation importance (penurunan macro F1 bila fitur diacak)", "",
        importance.to_frame("importance").to_markdown(), "",
    ]
    (DOCS / "evaluasi_model.md").write_text("\n".join(report), encoding="utf-8")
    # Hash tanpa CRLF, supaya versi model sama di Windows dan Linux.
    digest = hashlib.sha256(DATA.read_bytes().replace(b"\r\n", b"\n")).hexdigest()
    version = f"{best_name}-v0.5-{digest[:8]}"
    results["model_version"] = version
    (MODEL_PATH.parent / "metrics.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    joblib.dump({"model": best, "features": FEATURES, "labels": LABELS, "name": best_name,
                 "version": version, "dataset_sha256": digest}, MODEL_PATH)
    print(json.dumps(results["test"], indent=2))
    print(f"Model terpilih: {best_name} -> {MODEL_PATH}")


if __name__ == "__main__":
    main()
