import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { motion, AnimatePresence } from "framer-motion";

function Root({ children, ...props }) {
  return <TooltipPrimitive.Root delayDuration={300} {...props}>{children}</TooltipPrimitive.Root>;
}

function Trigger({ children, asChild = true }) {
  return <TooltipPrimitive.Trigger asChild={asChild}>{children}</TooltipPrimitive.Trigger>;
}

function Content({ children, side = "right", sideOffset = 8 }) {
  return (
    <AnimatePresence>
      <TooltipPrimitive.Content asChild side={side} sideOffset={sideOffset} align="center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: -2 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: -2 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="z-50 px-2.5 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap"
        >
          {children}
        </motion.div>
      </TooltipPrimitive.Content>
    </AnimatePresence>
  );
}

function Provider({ children }) {
  return <TooltipPrimitive.Provider>{children}</TooltipPrimitive.Provider>;
}

export { Root, Trigger, Content, Provider };
