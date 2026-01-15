'use client';
import CodeEditor from "@/components/code-editor";
import { useState } from "react";
import AssemblyInfo from "@/components/assembly-info";
import Root from "@/components/root";
import Sidebar from "@/components/sidebar";
import { redirect } from 'next/navigation';


export default function Home() {
  redirect('/login');  

  return (
    <div className="flex flex-col justify-center items-center w-screen space-y-4">
      <main className="ml-20 md:m2-64 p-4 pl-16">
        <Sidebar />
        <Root/>
      </main>
      
    </div>
  );
  return (
    <div className="flex flex-col justify-center items-center w-screen space-y-4">
      <Root/>
    </div>
  );
}
