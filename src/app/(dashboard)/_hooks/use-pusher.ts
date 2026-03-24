"use client";

import Pusher from "pusher-js";
import { useEffect, useRef } from "react";

export function usePusher(): Pusher | null {
  const pusherRef = useRef<Pusher | null>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;

    pusherRef.current = new Pusher(key, { cluster });

    return () => {
      pusherRef.current?.disconnect();
      pusherRef.current = null;
    };
  }, []);

  // eslint-disable-next-line react-hooks/refs
  return pusherRef.current;
}
