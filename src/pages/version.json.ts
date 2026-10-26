import type { APIRoute } from 'astro';
import { BUILD_VERSION, BUILD_SHA, BUILD_TIME } from '../data/build';

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ version: BUILD_VERSION, commit: BUILD_SHA, builtAt: BUILD_TIME }), {
    headers: { 'Content-Type': 'application/json' },
  });
