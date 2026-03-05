import React from "react";
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { fontData } from "@/lib/delivery/font-data";

Font.register({
  family: "DM Sans",
  src: `data:font/truetype;base64,${fontData.dmSans400}`,
});

const styles = StyleSheet.create({
  page: { backgroundColor: "#ffffff", padding: 40 },
  text: { color: "#000000", fontFamily: "DM Sans", fontSize: 14 },
});

const TestDoc = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View>
        <Text style={styles.text}>Font test: Adaeze Okafor — Software Engineer</Text>
        <Text style={styles.text}>If you can read this, fonts are working.</Text>
      </View>
    </Page>
  </Document>
);

export async function GET() {
  try {
    const buffer = await renderToBuffer(<TestDoc />);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Disposition": "inline; filename=\"test.pdf\"",
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message, stack: err.stack ?? "" },
      { status: 500 },
    );
  }
}
