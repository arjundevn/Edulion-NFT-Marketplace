import { useRouter } from "next/dist/client/router";
import React from "react";

export default function Nft() {
  const route = useRouter();
  const id = route.query.nft;
  console.log(id);
  return <div>{id}</div>;
}
