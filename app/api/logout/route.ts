import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const azureTenantId = process.env.AZURE_AD_TENANT_ID;
  const nextAuthUrl = process.env.NEXTAUTH_URL;

  if (!azureTenantId || !nextAuthUrl) {
    return NextResponse.json(
      { error: 'Configuration error' },
      { status: 500 }
    );
  }

  const logoutUrl = `https://login.microsoftonline.com/${azureTenantId}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(nextAuthUrl)}`;

  // Clear the session cookie explicitly
  const response = NextResponse.redirect(logoutUrl);
  response.cookies.delete('__Secure-next-auth.session-token');

  return response;
}
