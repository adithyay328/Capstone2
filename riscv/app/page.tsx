'use client';
import CodeEditor from "@/components/code-editor";
import { useState } from "react";
import AssemblyInfo from "@/components/assembly-info";
import Root from "@/components/root";
import { redirect } from 'next/navigation';


export default function Home() {
  // This page should never be reached due to middleware protection
  // but we'll redirect to login just in case
  redirect('/login');

  return (
    <div className="flex flex-col justify-center items-center w-screen space-y-4">
      <Root/>
    </div>
  );
}
