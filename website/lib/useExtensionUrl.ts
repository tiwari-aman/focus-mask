"use client";

import { useEffect, useState } from "react";
import { CHROME_STORE_URL, FIREFOX_STORE_URL } from "./constants";

export function useExtensionUrl() {
  const [url, setUrl] = useState(CHROME_STORE_URL);

  useEffect(() => {
    if (
      typeof navigator !== "undefined" &&
      /firefox/i.test(navigator.userAgent)
    ) {
      setUrl(FIREFOX_STORE_URL);
    }
  }, []);

  return url;
}
