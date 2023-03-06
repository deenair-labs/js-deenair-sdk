export class DeenairJSONRPCError extends Error {
  code: unknown;
  data?: any;
  constructor(
    {
      code,
      message,
      data,
    }: Readonly<{ code: unknown; message: string; data?: any }>,
    customMessage?: string,
  ) {
    super(customMessage != null ? `${customMessage}: ${message}` : message);
    this.code = code;
    this.data = data;
    this.name = 'DeenairJSONRPCError';
  }
}
