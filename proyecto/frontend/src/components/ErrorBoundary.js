import React from "react";
import { Box, Heading, Text, Button } from "@chakra-ui/react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box textAlign="center" py={20} px={6}>
          <Heading size="xl" mb={4}>Something went wrong</Heading>
          <Text color="gray.500" mb={6}>{this.state.error?.message}</Text>
          <Button onClick={() => window.location.reload()}>Reload page</Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
