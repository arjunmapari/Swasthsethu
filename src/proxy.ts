import { NextResponse, type NextRequest } from "next/server";

/**
 * A URL with broken percent-encoding (for example "/doctor/%E0%A4%A") makes the framework
 * throw while reading the address, which surfaces as a 500. Answer 400 instead.
 */
export function proxy(req: NextRequest) {
  try {
    decodeURIComponent(req.nextUrl.pathname);
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
