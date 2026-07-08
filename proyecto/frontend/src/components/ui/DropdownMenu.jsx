import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

function Root({ children, ...props }) {
  return <DropdownMenuPrimitive.Root {...props}>{children}</DropdownMenuPrimitive.Root>;
}

function Trigger({ children, ...props }) {
  return <DropdownMenuPrimitive.Trigger asChild {...props}>{children}</DropdownMenuPrimitive.Trigger>;
}

function Content({ children, align = "end", sideOffset = 4, className = "" }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <AnimatePresence>
        <DropdownMenuPrimitive.Content
          asChild
          align={align}
          sideOffset={sideOffset}
          className="z-50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className={`min-w-[140px] bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-xl py-1 ${className}`}
          >
            {children}
          </motion.div>
        </DropdownMenuPrimitive.Content>
      </AnimatePresence>
    </DropdownMenuPrimitive.Portal>
  );
}

function Item({ children, danger, ...props }) {
  return (
    <DropdownMenuPrimitive.Item
      {...props}
      className={`flex items-center gap-2 w-full px-3.5 py-2 text-sm cursor-default select-none outline-none transition-colors ${
        danger
          ? "text-red-600 dark:text-red-400 data-[highlighted]:bg-red-50 dark:data-[highlighted]:bg-red-950/30"
          : "text-gray-700 dark:text-gray-300 data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-800"
      }`}
    >
      {children}
    </DropdownMenuPrimitive.Item>
  );
}

function Separator() {
  return <DropdownMenuPrimitive.Separator className="h-px bg-gray-100 dark:bg-gray-800 my-1" />;
}

export { Root, Trigger, Content, Item, Separator };
