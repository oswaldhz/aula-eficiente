import * as SelectPrimitive from "@radix-ui/react-select";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

function Root({ children, ...props }) {
  return <SelectPrimitive.Root {...props}>{children}</SelectPrimitive.Root>;
}

function Trigger({ placeholder, className = "", disabled, ...props }) {
  return (
    <SelectPrimitive.Trigger
      disabled={disabled}
      {...props}
      className={`flex items-center justify-between gap-2 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none transition-all data-[placeholder]:text-gray-400 disabled:opacity-50 ${className}`}
    >
      <SelectPrimitive.Value placeholder={placeholder} />
      <SelectPrimitive.Icon>
        <ChevronDown size={15} className="text-gray-400" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function Content({ children, className = "" }) {
  return (
    <SelectPrimitive.Portal>
      <AnimatePresence>
        <SelectPrimitive.Content asChild position="popper" sideOffset={4}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className={`z-50 min-w-[var(--radix-select-trigger-width)] bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-xl py-1 ${className}`}
          >
            <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
          </motion.div>
        </SelectPrimitive.Content>
      </AnimatePresence>
    </SelectPrimitive.Portal>
  );
}

function Item({ children, value, className = "" }) {
  return (
    <SelectPrimitive.Item
      value={value}
      className={`flex items-center gap-2 px-3.5 py-2 text-sm text-gray-700 dark:text-gray-300 cursor-default select-none outline-none data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-800 data-[state=checked]:text-brand-600 dark:data-[state=checked]:text-brand-400 transition-colors ${className}`}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export { Root, Trigger, Content, Item };
