'use client';
import Root from "@/components/root";
import Sidebar from "@/components/sidebar";

export default function DefaultEmpty() {

  return (
    <div className="flex flex-col justify-center items-center w-screen space-y-4">
      <Sidebar/>
      <main className="ml-20 md:m2-64 p-4">
        <Root/>
      </main>
      
    </div>
  );
}
