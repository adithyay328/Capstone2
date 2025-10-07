import React from 'react'

export default function AssemblyInfo() {
  return (
    //CURRENT HARDCODED IMPLEMENTATION
    //Will eventually get information from backend
    
      <div className="w-3/4 bg-gray-50 border-2 border-black rounded shadow-md p-4 space-y-3">
        <p className = "font-semibold text-sm text-black">ERROR MESSAGE : NO ERRORS</p>
        <div className="flex justify-between text-sm">
          {/* Registers Section */}
          <div>
            <p className="font-semibold mb-1 text-black">REGISTERS</p>
            <p className="text-black">x0 : 0xa | 19</p>
            <p className="text-black">...</p>
          </div>

          {/* Memory Section */}
          <div>
            <p className="font-semibold mb-1 text-black">MEMORY:</p>
            <p className="text-black">0x0000: 0xb | 11</p>
            <p className="text-black">...</p>
          </div>
        </div>
      </div>
  );
}
