import { auth } from "./auth"

const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 100;

const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);
    
    if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(ip, { count: 1, timestamp: now });
        return false;
    }
    
    if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
        return true;
    }
    
    record.count++;
    return false;
}

export default auth((req) => {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               'unknown';

    if (isRateLimited(ip)) {
        return new Response('Too Many Requests', { status: 429 });
    }

    if (!req.auth && req.nextUrl.pathname !== "/login" && req.nextUrl.pathname.startsWith('/dashboard')) {
        const newUrl = new URL("/login", req.nextUrl.origin)
        return Response.redirect(newUrl)
    }
})

export const config = {
    matcher: ["/dashboard/:path*", "/api/:path*"],
}
