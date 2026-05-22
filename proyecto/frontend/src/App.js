import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, Select, Flex, Text, Button, Avatar, Menu, MenuButton, MenuList, MenuItem, useColorModeValue } from "@chakra-ui/react";
import { SignedIn, SignedOut, RedirectToSignIn, useUser, useClerk } from "@clerk/clerk-react";
import { ChevronDown } from "lucide-react";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import StudentsPage from "./pages/StudentsPage";
import ClassroomsPage from "./pages/ClassroomsPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import GradesPage from "./pages/GradesPage";
import ReportsPage from "./pages/ReportsPage";
import PeriodsPage from "./pages/PeriodsPage";
import TeachersPage from "./pages/TeachersPage";
import ErrorBoundary from "./components/ErrorBoundary";
import { useFetch } from "./api";

function UserProfile() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const menuBg = useColorModeValue("white", "gray.800");

  return (
    <Menu>
      <MenuButton as={Button} rightIcon={<ChevronDown />} variant="ghost" w="full" justifyContent="space-between" px={2}>
        <Flex align="center">
          <Avatar size="sm" name={user?.fullName} src={user?.profileImageUrl} mr={2} />
          <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
            {user?.firstName || user?.username}
          </Text>
        </Flex>
      </MenuButton>
      <MenuList bg={menuBg}>
        <MenuItem onClick={() => signOut()}>Logout</MenuItem>
      </MenuList>
    </Menu>
  );
}

function PeriodSelector({ selectedPeriodo, setSelectedPeriodo, periodos }) {
  return (
    <Select
      size="sm"
      borderRadius="md"
      value={selectedPeriodo}
      onChange={(e) => {
        setSelectedPeriodo(e.target.value);
        localStorage.setItem("periodo", e.target.value);
      }}
      bg={useColorModeValue("white", "gray.700")}
    >
      {periodos.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name} - {p.year}
        </option>
      ))}
    </Select>
  );
}

const App = () => {
  const [periodos, setPeriodos] = useState([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState(localStorage.getItem("periodo") || "");
  const { fetchData } = useFetch();

  useEffect(() => {
    loadPeriodos();
  }, []);

  useEffect(() => {
    if (periodos.length > 0 && !periodos.find(p => p.id.toString() === selectedPeriodo?.toString())) {
      const firstId = periodos[0]?.id || "";
      setSelectedPeriodo(firstId);
      localStorage.setItem("periodo", firstId);
    }
  }, [periodos, selectedPeriodo]);

  const loadPeriodos = async () => {
    const data = await fetchData("periods");
    setPeriodos(data);
  };

  return (
    <>
      <SignedIn>
        <Layout
          periodSelector={<PeriodSelector selectedPeriodo={selectedPeriodo} setSelectedPeriodo={setSelectedPeriodo} periodos={periodos} />}
          userProfile={<UserProfile />}
        >
          <ErrorBoundary>
            <Box key={selectedPeriodo}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/classrooms" element={<ClassroomsPage />} />
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/activities" element={<ActivitiesPage />} />
                <Route path="/grades" element={<GradesPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/periods" element={<PeriodsPage />} />
                <Route path="/teachers" element={<TeachersPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Box>
          </ErrorBoundary>
        </Layout>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

export default App;