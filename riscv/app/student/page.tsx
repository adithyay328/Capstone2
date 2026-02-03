'use client';
import { useState } from "react";
import Root from "@/components/root";
import Sidebar from "@/components/sidebar";


export default function Home() {
  const [code, setCode] = useState("");

  return (
    <div className="flex flex-col justify-center items-center w-screen space-y-4">
      <main className="md:m2-64 p-4">
        <Root/>
      </main>
      
    </div>
  );
}
