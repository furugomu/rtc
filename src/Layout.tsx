import { Box, Container, Heading, Stack } from "@chakra-ui/layout";
import { ReactNode } from "react";

type Props = {
  children?: ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <Box>
      <Header />
      <Container py={4}>{children}</Container>
    </Box>
  );
}

const Header = () => (
  <Box as="header" p={2} bg="blue.300" color="blackAlpha.700">
    <Stack direction="row">
      <Heading>WebRTC の素振り</Heading>
    </Stack>
  </Box>
);
