import React, { useCallback, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { ChipGroup } from "@/components/Chip";
import { physioApi } from "@/api/endpoints";
import { ApiError } from "@/api/client";
import { API_BASE_URL } from "@/api/config";
import { DOCUMENT_TYPE_LABEL, DOCUMENT_TYPES } from "@/api/types";
import type { Document, DocumentType, PhysioProfile } from "@/api/types";
import { colors, spacing } from "@/theme/colors";

export default function ManageDocumentsScreen() {
  const [physio, setPhysio] = useState<PhysioProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<DocumentType | undefined>();
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { physio: result } = await physioApi.me();
      setPhysio(result);
    } catch {
      // Ignore — screen just stays empty and the user can navigate back and retry.
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function pickAndUpload() {
    setError(null);
    if (!type) {
      setError("Choose which kind of document this is first");
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/jpeg", "image/png", "image/heic"],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploading(true);
    try {
      await physioApi.uploadDocument(type, {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType ?? "application/octet-stream",
      });
      setType(undefined);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't upload this document");
    } finally {
      setUploading(false);
    }
  }

  async function remove(document: Document) {
    setDeletingId(document.id);
    try {
      await physioApi.deleteDocument(document.id);
      await load();
    } catch {
      // Ignore — document stays listed and the user can retry.
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>My Documents</Text>
      <Text style={styles.subtitle}>
        Upload proof of registration, insurance, and DBS so clubs — and our vetting process — can verify you faster.
      </Text>

      <View style={styles.list}>
        {physio?.documents?.map((document) => (
          <Card key={document.id} style={styles.docCard}>
            <View style={styles.docRow}>
              <View style={styles.docInfo}>
                <Text style={styles.docType}>{DOCUMENT_TYPE_LABEL[document.type]}</Text>
                <Text
                  style={styles.docLink}
                  onPress={() => Linking.openURL(`${API_BASE_URL}${document.fileUrl}`)}
                  numberOfLines={1}
                >
                  {document.fileName}
                </Text>
                <Text style={styles.meta}>Uploaded {new Date(document.uploadedAt).toLocaleDateString()}</Text>
              </View>
              <Button title="Remove" variant="ghost" onPress={() => remove(document)} loading={deletingId === document.id} />
            </View>
          </Card>
        ))}
        {!loading && (!physio?.documents || physio.documents.length === 0) ? (
          <Text style={styles.empty}>No documents uploaded yet.</Text>
        ) : null}
      </View>

      <Card style={styles.formCard}>
        <Text style={styles.formTitle}>Upload a Document</Text>
        <ChipGroup
          label="Document Type"
          options={DOCUMENT_TYPES.map((t) => ({ value: t, label: DOCUMENT_TYPE_LABEL[t] }))}
          value={type}
          onChange={setType}
          required
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Choose File & Upload" onPress={pickAndUpload} loading={uploading} testID="upload-document-btn" />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginTop: spacing.sm },
  subtitle: { color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.md, lineHeight: 18 },
  list: { marginTop: spacing.md },
  docCard: { marginBottom: spacing.sm },
  docRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  docInfo: { flexShrink: 1, marginRight: spacing.sm },
  docType: { fontWeight: "700", color: colors.text },
  docLink: { color: colors.primary, marginTop: spacing.xs, textDecorationLine: "underline" },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  empty: { color: colors.textMuted, marginTop: spacing.sm },
  formCard: { marginTop: spacing.lg },
  formTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: spacing.md },
  error: { color: colors.danger, marginBottom: spacing.md },
});
