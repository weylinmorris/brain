'use client';

import {BlockProvider} from "@/context/block";
import Main from "@/components/homepage/Main.jsx";
import Sidebar from "@/components/homepage/Sidebar.jsx";
import Recommended from "@/components/homepage/Recommended.jsx";
import {ToastProvider} from "@/context/toast/ToastContext.js";

export default function Home() {
  return (
      <BlockProvider>
          <ToastProvider>
              <div className="flex items-stretch h-full">
                  <Sidebar/>
                  <Main/>
                  <Recommended/>
              </div>
          </ToastProvider>
      </BlockProvider>
  );
}
