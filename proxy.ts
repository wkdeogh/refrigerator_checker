import { NextRequest, NextResponse } from "next/server";

function unauthorizedResponse() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Refrigerator Checker"',
    },
  });
}

export function proxy(request: NextRequest) {
  const username = process.env.APP_BASIC_AUTH_USER;
  const password = process.env.APP_BASIC_AUTH_PASSWORD;

  if (!username && !password) {
    return NextResponse.next();
  }

  if (!username || !password) {
    return unauthorizedResponse();
  }

  const authorization = request.headers.get("authorization");
  if (!authorization || !authorization.startsWith("Basic ")) {
    return unauthorizedResponse();
  }

  const encodedCredentials = authorization.replace("Basic ", "").trim();
  const decodedCredentials = atob(encodedCredentials);
  const separatorIndex = decodedCredentials.indexOf(":");

  if (separatorIndex === -1) {
    return unauthorizedResponse();
  }

  const inputUser = decodedCredentials.slice(0, separatorIndex);
  const inputPassword = decodedCredentials.slice(separatorIndex + 1);

  if (inputUser !== username || inputPassword !== password) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
