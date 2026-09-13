export type HasilPenjaga =
  | { lolos: true }
  | { lolos: false; status: number; badan: { error: string; message: string } };

export function periksaAdmin(env: Record<string, unknown>): HasilPenjaga {
  if (env.ADMIN_DEV_BYPASS === "true") {
    return { lolos: true };
  }

  return {
    lolos: false,
    status: 401,
    badan: {
      error: "unauthorized",
      message: "Endpoint admin butuh autentikasi",
    },
  };
}
