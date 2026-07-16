"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DrawerProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Drawer({ open, title, subtitle, onClose, children }: DrawerProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            aria-label="Fermer le panneau"
            className="fixed inset-0 z-40 bg-[#18232B]/18 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[460px] flex-col border-l border-[#D8E5EC] bg-white shadow-[0_20px_80px_rgba(24,35,43,0.22)]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#D8E5EC] p-5">
              <div className="min-w-0">
                <h2 className="break-words text-lg font-black text-[#18232B]">{title}</h2>
                {subtitle ? <p className="mt-1 text-sm text-[#596A76]">{subtitle}</p> : null}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="premium-scrollbar flex-1 overflow-y-auto p-5">{children}</div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
