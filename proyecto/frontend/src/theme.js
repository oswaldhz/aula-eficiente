import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  colors: {
    brand: {
      50: "#eef2ff",
      100: "#e0e7ff",
      200: "#c7d2fe",
      300: "#a5b4fc",
      400: "#818cf8",
      500: "#6366f1",
      600: "#4f46e5",
      700: "#4338ca",
      800: "#3730a3",
      900: "#312e81",
    },
    accent: {
      50: "#fdf2f8",
      100: "#fce7f3",
      200: "#fbcfe8",
      300: "#f9a8d4",
      400: "#f472b6",
      500: "#ec4899",
      600: "#db2777",
      700: "#be185d",
      800: "#9d174d",
      900: "#831843",
    },
    neutral: {
      50: "#fafafa",
      100: "#f4f4f5",
      200: "#e4e4e7",
      300: "#d4d4d8",
      400: "#a1a1aa",
      500: "#71717a",
      600: "#52525b",
      700: "#3f3f46",
      800: "#27272a",
      900: "#18181b",
    },
  },
  fonts: {
    heading: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  },
  styles: {
    global: {
      body: {
        bg: "neutral.50",
        color: "neutral.800",
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: "semibold",
        borderRadius: "lg",
        transition: "all 0.2s ease",
      },
      variants: {
        solid: {
          bg: "brand.600",
          color: "white",
          _hover: {
            bg: "brand.700",
            transform: "translateY(-1px)",
            boxShadow: "md",
          },
          _active: {
            bg: "brand.800",
            transform: "translateY(0)",
          },
        },
        ghost: {
          _hover: {
            bg: "brand.50",
          },
        },
      },
      defaultProps: {
        colorScheme: "brand",
      },
    },
    Card: {
      baseStyle: {
        bg: "white",
        borderRadius: "2xl",
        boxShadow: "sm",
        borderWidth: "1px",
        borderColor: "neutral.200",
        transition: "all 0.3s ease",
        _hover: {
          boxShadow: "lg",
          borderColor: "brand.200",
        },
      },
    },
    Heading: {
      baseStyle: {
        fontWeight: "bold",
        letterSpacing: "-0.02em",
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: "lg",
          borderColor: "neutral.200",
          _hover: {
            borderColor: "brand.300",
          },
          _focus: {
            borderColor: "brand.500",
            boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)",
          },
        },
      },
    },
    Select: {
      baseStyle: {
        field: {
          borderRadius: "lg",
          borderColor: "neutral.200",
          _hover: {
            borderColor: "brand.300",
          },
          _focus: {
            borderColor: "brand.500",
            boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)",
          },
        },
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: "full",
        px: 2,
        py: 0.5,
        fontWeight: "medium",
      },
    },
  },
});

export default theme;