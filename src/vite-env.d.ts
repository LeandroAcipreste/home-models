/// <reference types="vite/client" />

/** DOM suporta `defaultMuted` em `<video>`/`<audio>`; os tipos do React por vezes omitiram-no (TS2322 na CI). */
import "react";

declare module "react" {
  interface MediaHTMLAttributes<T> {
    defaultMuted?: boolean | undefined;
  }
}
