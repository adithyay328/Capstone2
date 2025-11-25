'use client';
import CodeEditor from "@/components/code-editor";
import { useState } from "react";
import AssemblyInfo from "@/components/assembly-info";
import Root from "@/components/root";
import Link from 'next/link';


export default function Home() {
  const [code, setCode] = useState("");

  return (
    <div className="flex flex-col justify-center items-center w-screen space-y-4">
      <div className="w-full max-w-4xl px-4 mb-4">
        <Link 
          href="/student/labs" 
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          View Labs
        </Link>
      </div>
      <Root/>
    </div>
  );
}
