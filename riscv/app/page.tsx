'use client';
import CodeEditor from "@/components/code-editor";
import { useState } from "react";
import AssemblyInfo from "@/components/assembly-info";
import Root from "@/components/root";
import Sidebar from "@/components/sidebar";
import { redirect } from 'next/navigation';


export default function Home() {
  redirect('/login');  

}
