# -*- coding: utf-8 -*-
"""
supabase/schema_and_seed.sql をSupabaseのPostgresに直接接続して実行するスクリプト。

DBパスワードはハードコードせず、環境変数 SUPABASE_DB_PASSWORD から読み込む。
使い方:
  $env:SUPABASE_DB_PASSWORD = "..."
  py supabase/run_seed.py
"""
import os
import sys
import psycopg2

PROJECT_REF = "xhvtvctswpinrujrbvjk"
# Session Pooler経由(IPv4対応)。直接接続(db.<ref>.supabase.co)はIPv6専用でこの環境から到達不可のため使用。
DB_HOST = "aws-0-ap-southeast-2.pooler.supabase.com"
DB_PORT = 5432
DB_NAME = "postgres"
DB_USER = f"postgres.{PROJECT_REF}"

SQL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schema_and_seed.sql")


def main():
    password = os.environ.get("SUPABASE_DB_PASSWORD")
    if not password:
        print("環境変数 SUPABASE_DB_PASSWORD が設定されていません。", file=sys.stderr)
        sys.exit(1)

    with open(SQL_PATH, encoding="utf-8") as f:
        sql = f.read()

    print(f"接続先: {DB_HOST}:{DB_PORT}/{DB_NAME}")
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=password,
        sslmode="require",
        connect_timeout=15,
    )
    try:
        conn.autocommit = False
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()
        print("スキーマ作成・シード投入が完了しました。")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
