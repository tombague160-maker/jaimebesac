"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDialog } from "@/components/ui/use-dialog";

interface ModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ open, title, subtitle, onClose, children }: ModalProps) {
  const dialogRef = useDialog(open, onClose);
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <motion.button
            aria-label="Fermer la modale"
            tabIndex={-1}
            className="absolute inset-0 bg-[#18232B]/22 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className="relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-lg min-w-0 flex-col overflow-hidden rounded-lg border border-[#D8E5EC] bg-white shadow-[0_24px_80px_rgba(24,35,43,0.22)] outline-none"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.18 }}
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
            <div className="premium-scrollbar min-w-0 overflow-y-auto p-5">{children}</div>
          </motion.section>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
