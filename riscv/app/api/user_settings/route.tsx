import { NextRequest } from 'next/server';
import { verifyCookieInternal } from '@/app/verify/internal';
import { modifyCookieData } from '@/app/verify/modify';
import { DBConnection } from '@/app/sql/sql';
import {
  DEFAULT_USER_SETTINGS,
  UserSettingsSchema,
  type UserSettings,
  type UserSettingsResponse,
} from './types';

function mapRowToSettings(row: Record<string, unknown> | undefined): UserSettings {
  if (!row) {
    return DEFAULT_USER_SETTINGS;
  }

  return {
    editorFontSize:
      typeof row.editor_font_size === 'number'
        ? row.editor_font_size
        : DEFAULT_USER_SETTINGS.editorFontSize,
    showHelpBubble:
      typeof row.show_help_bubble === 'boolean'
        ? row.show_help_bubble
        : DEFAULT_USER_SETTINGS.showHelpBubble,
    openInstructionsByDefault:
      typeof row.open_instructions_by_default === 'boolean'
        ? row.open_instructions_by_default
        : DEFAULT_USER_SETTINGS.openInstructionsByDefault,
    warnBeforeReinstate:
      typeof row.warn_before_reinstate === 'boolean'
        ? row.warn_before_reinstate
        : DEFAULT_USER_SETTINGS.warnBeforeReinstate,
  };
}

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') || '';
  const verifyResponse = await verifyCookieInternal(cookieHeader);

  if (!verifyResponse.data || !verifyResponse.data.username) {
    const modifiedCookie = await modifyCookieData({});

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Invalid or missing authentication',
      } satisfies UserSettingsResponse),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': modifiedCookie,
        },
      }
    );
  }

  let db: DBConnection | null = null;

  try {
    db = await DBConnection.create();
    const result = await db.client.query(
      `SELECT editor_font_size,
              show_help_bubble,
              open_instructions_by_default,
              warn_before_reinstate
       FROM user_settings
       WHERE username = $1`,
      [verifyResponse.data.username]
    );

    return new Response(
      JSON.stringify({
        success: true,
        settings: mapRowToSettings(result.rows[0]),
      } satisfies UserSettingsResponse),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('user_settings GET:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to load user settings',
      } satisfies UserSettingsResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } finally {
    if (db) {
      try {
        await db.client.end();
      } catch {}
    }
  }
}

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') || '';
  const verifyResponse = await verifyCookieInternal(cookieHeader);

  if (!verifyResponse.data || !verifyResponse.data.username) {
    const modifiedCookie = await modifyCookieData({});

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Invalid or missing authentication',
      } satisfies UserSettingsResponse),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': modifiedCookie,
        },
      }
    );
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const parsed = UserSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Invalid settings payload',
      } satisfies UserSettingsResponse),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  let db: DBConnection | null = null;

  try {
    db = await DBConnection.create();
    const result = await db.client.query(
      `INSERT INTO user_settings (
          username,
          editor_font_size,
          show_help_bubble,
          open_instructions_by_default,
          warn_before_reinstate,
          updated_at
       )
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (username) DO UPDATE
       SET editor_font_size = EXCLUDED.editor_font_size,
           show_help_bubble = EXCLUDED.show_help_bubble,
           open_instructions_by_default = EXCLUDED.open_instructions_by_default,
           warn_before_reinstate = EXCLUDED.warn_before_reinstate,
           updated_at = now()
       RETURNING editor_font_size,
                 show_help_bubble,
                 open_instructions_by_default,
                 warn_before_reinstate`,
      [
        verifyResponse.data.username,
        parsed.data.editorFontSize,
        parsed.data.showHelpBubble,
        parsed.data.openInstructionsByDefault,
        parsed.data.warnBeforeReinstate,
      ]
    );

    return new Response(
      JSON.stringify({
        success: true,
        settings: mapRowToSettings(result.rows[0]),
      } satisfies UserSettingsResponse),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('user_settings POST:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to save user settings',
      } satisfies UserSettingsResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } finally {
    if (db) {
      try {
        await db.client.end();
      } catch {}
    }
  }
}
