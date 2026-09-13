# -*- coding: utf-8 -*-
"""
questions.json から Supabase 用のスキーマ定義+シードSQLを生成するスクリプト。
生成物は supabase/schema_and_seed.sql に書き出す。
Supabase Dashboard の SQL Editor に貼り付けて実行することを想定。
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUESTIONS_PATH = os.path.join(ROOT, "questions.json")
OUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schema_and_seed.sql")


def sql_str(s):
    """SQL文字列リテラル用にエスケープしてシングルクォートで囲む"""
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def sql_jsonb(obj):
    """dictをJSONB用のSQLリテラルに変換"""
    json_str = json.dumps(obj, ensure_ascii=False)
    return "'" + json_str.replace("'", "''") + "'::jsonb"


def main():
    with open(QUESTIONS_PATH, encoding="utf-8") as f:
        questions = json.load(f)

    schema_sql = """-- ============================================================
-- shikaku-no-shima: questions テーブル スキーマ定義
-- 第二種衛生管理者 過去問データ (2021年4月〜2026年4月, 全330問)
-- ============================================================

create table if not exists public.questions (
  id text primary key,
  year integer not null,
  month integer not null,
  exam_label text not null,
  field text not null check (field in ('関係法令', '労働衛生', '労働生理')),
  question_number integer not null,
  question_text text not null,
  options jsonb not null,
  answer text not null check (answer in ('1', '2', '3', '4', '5')),
  explanation text,
  key_point text,
  created_at timestamptz not null default now()
);

comment on table public.questions is '第二種衛生管理者試験 過去問(2021年4月〜2026年4月、全330問)';
comment on column public.questions.id is '問題ID (例: 2021-04-Q01)';
comment on column public.questions.field is '出題分野: 関係法令 / 労働衛生 / 労働生理';
comment on column public.questions.options is '選択肢 {"1": "...", "2": "...", ..., "5": "..."}';
comment on column public.questions.answer is '正答の選択肢番号 (1〜5の文字列)';

create index if not exists questions_field_idx on public.questions (field);
create index if not exists questions_year_month_idx on public.questions (year, month);

-- Row Level Security: アプリからは読み取り専用でアクセスさせる
alter table public.questions enable row level security;

drop policy if exists "Allow public read access" on public.questions;
create policy "Allow public read access"
  on public.questions
  for select
  using (true);

-- ============================================================
-- シードデータ (全330問, id重複時は上書き = 再実行しても安全)
-- ============================================================

insert into public.questions
  (id, year, month, exam_label, field, question_number, question_text, options, answer, explanation, key_point)
values
"""

    rows = []
    for q in questions:
        row = "  ({id}, {year}, {month}, {exam_label}, {field}, {question_number}, {question_text}, {options}, {answer}, {explanation}, {key_point})".format(
            id=sql_str(q["id"]),
            year=q["year"],
            month=q["month"],
            exam_label=sql_str(q["examLabel"]),
            field=sql_str(q["field"]),
            question_number=q["questionNumber"],
            question_text=sql_str(q["questionText"]),
            options=sql_jsonb(q["options"]),
            answer=sql_str(q["answer"]),
            explanation=sql_str(q.get("explanation")),
            key_point=sql_str(q.get("keyPoint")),
        )
        rows.append(row)

    values_sql = ",\n".join(rows)

    conflict_sql = """
on conflict (id) do update set
  year = excluded.year,
  month = excluded.month,
  exam_label = excluded.exam_label,
  field = excluded.field,
  question_number = excluded.question_number,
  question_text = excluded.question_text,
  options = excluded.options,
  answer = excluded.answer,
  explanation = excluded.explanation,
  key_point = excluded.key_point;
"""

    full_sql = schema_sql + values_sql + "\n" + conflict_sql

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write(full_sql)

    print(f"書き出し完了: {OUT_PATH}")
    print(f"問題数: {len(questions)}")
    print(f"ファイルサイズ: {os.path.getsize(OUT_PATH):,} bytes")


if __name__ == "__main__":
    main()
