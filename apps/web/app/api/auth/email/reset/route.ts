export async function POST(request: Request) {
  return Response.json(
    {
      message: 'Paceframe now sends password reset emails directly through Firebase Authentication. This legacy endpoint is no longer used.'
    },
    { status: 410 }
  );
}
