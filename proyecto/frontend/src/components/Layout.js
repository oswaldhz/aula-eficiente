import React from "react";
import { Box, Flex, VStack, Icon, Text, useColorModeValue, Divider } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ClipboardList,
  GraduationCap,
  FileText,
  Calendar,
  UserCog,
} from "lucide-react";

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const NavItem = ({ icon, children, to }) => {
  const activeColor = useColorModeValue("brand.600", "brand.300");
  const hoverBg = useColorModeValue("brand.50", "gray.700");
  const activeBg = useColorModeValue("brand.50", "brand.900");

  return (
    <NavLink to={to} style={{ textDecoration: "none", width: "100%" }}>
      {({ isActive }) => (
        <MotionFlex
          align="center"
          p={3}
          mx={2}
          borderRadius="xl"
          cursor="pointer"
          bg={isActive ? activeBg : "transparent"}
          color={isActive ? activeColor : "neutral.600"}
          whileHover={{ backgroundColor: hoverBg, x: 4 }}
          transition={{ duration: 0.2 }}
        >
          <Icon as={icon} mr={3} boxSize={5} />
          <Text fontWeight={isActive ? "semibold" : "normal"}>{children}</Text>
        </MotionFlex>
      )}
    </NavLink>
  );
};

export default function Layout({ children, periodSelector, userProfile }) {
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("neutral.200", "gray.700");

  return (
    <Flex h="100vh" bg="neutral.50">
      <MotionBox
        w="280px"
        bg={bg}
        borderRight="1px"
        borderColor={borderColor}
        h="full"
        overflowY="auto"
        display="flex"
        flexDirection="column"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <VStack align="stretch" spacing={1} p={4}>
          <Text fontSize="2xl" fontWeight="bold" bgGradient="linear(to-r, brand.600, accent.600)" bgClip="text" mb={4} textAlign="center">
            Eficient Class
          </Text>
          <NavItem icon={LayoutDashboard} to="/">Dashboard</NavItem>
          <NavItem icon={BookOpen} to="/classrooms">Classrooms</NavItem>
          <NavItem icon={Users} to="/students">Students</NavItem>
          <NavItem icon={ClipboardList} to="/activities">Activities</NavItem>
          <NavItem icon={GraduationCap} to="/grades">Grades</NavItem>
          <NavItem icon={UserCog} to="/teachers">Teachers</NavItem>
          <NavItem icon={FileText} to="/reports">Reports</NavItem>
          <NavItem icon={Calendar} to="/periods">Periods</NavItem>
        </VStack>
        <Divider my={4} borderColor={borderColor} />
        <Box px={4} pb={2}>
          {periodSelector}
        </Box>
        <Box mt="auto" px={4} pb={4}>
          {userProfile}
        </Box>
      </MotionBox>

      <MotionBox
        flex="1"
        overflowY="auto"
        p={6}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {children}
      </MotionBox>
    </Flex>
  );
}