import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { ChipGroup } from "@/components/Chip";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/api/client";
import { homeHref } from "@/utils/navigation";
import { REGISTRATION_BODIES } from "@/api/types";
import type { Role, User } from "@/api/types";
import { colors, radius, spacing } from "@/theme/colors";

const SPORT_OPTIONS = ["Football", "Rugby", "Hockey", "Netball", "Basketball", "Cricket", "Athletics", "Swimming"];

export default function RegisterScreen() {
  const { register } = useAuth();
  const [role, setRole] = useState<Role>("PHYSIO");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Physio fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [physioLocation, setPhysioLocation] = useState("");
  const [travelRadiusMiles, setTravelRadiusMiles] = useState("20");
  const [registrationBody, setRegistrationBody] = useState<(typeof REGISTRATION_BODIES)[number] | undefined>();
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [dayRate, setDayRate] = useState("");
  const [sports, setSports] = useState<string[]>([]);
  const [otherSports, setOtherSports] = useState("");

  // Club fields
  const [clubName, setClubName] = useState("");
  const [clubSport, setClubSport] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [clubLocation, setClubLocation] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      let nextUser: User;
      if (role === "PHYSIO") {
        if (!fullName || !physioLocation) {
          setError("Full name and location are required");
          return;
        }
        if (!registrationBody) {
          setError("Select whether you're HCPC or CSP registered");
          return;
        }
        if (!registrationNumber.trim()) {
          setError("Your HCPC/CSP registration number is required");
          return;
        }
        const allSports = [...sports, ...otherSports.split(",").map((s) => s.trim()).filter(Boolean)];
        if (allSports.length === 0) {
          setError("List at least one sport you cover");
          return;
        }

        nextUser = await register({
          role: "PHYSIO",
          email: email.trim(),
          password,
          fullName,
          phone: phone || undefined,
          bio: bio || undefined,
          locationText: physioLocation,
          travelRadiusMiles: travelRadiusMiles ? Number(travelRadiusMiles) : undefined,
          registrationBody,
          registrationNumber: registrationNumber.trim(),
          yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
          dayRate: dayRate ? Number(dayRate) : undefined,
          sports: allSports,
        });
      } else {
        if (!clubName || !clubSport || !contactName || !clubLocation) {
          setError("Club name, sport, contact name, and location are required");
          return;
        }

        nextUser = await register({
          role: "CLUB",
          email: email.trim(),
          password,
          clubName,
          sport: clubSport,
          contactName,
          contactRole: contactRole || undefined,
          phone: phone || undefined,
          locationText: clubLocation,
        });
      }

      router.replace(homeHref(nextUser.role));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Create Account</Text>

      <Text style={styles.label}>I am a...</Text>
      <RoleToggle role={role} onChange={setRole} />

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        required
        testID="register-email-input"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="At least 8 characters"
        secureTextEntry
        required
        testID="register-password-input"
      />

      {role === "PHYSIO" ? (
        <>
          <TextField label="Full Name" value={fullName} onChangeText={setFullName} required testID="register-fullname-input" />
          <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" testID="register-phone-input" />
          <TextField label="Bio" value={bio} onChangeText={setBio} multiline numberOfLines={3} testID="register-bio-input" />

          <TextField
            label="Home Location"
            value={physioLocation}
            onChangeText={setPhysioLocation}
            placeholder="Manchester, UK"
            required
            testID="register-location-input"
          />
          <TextField
            label="Travel Radius (miles)"
            value={travelRadiusMiles}
            onChangeText={setTravelRadiusMiles}
            keyboardType="number-pad"
            testID="register-radius-input"
          />

          <ChipGroup
            label="Professional Registration Body"
            options={REGISTRATION_BODIES.map((b) => ({ value: b, label: b }))}
            value={registrationBody}
            onChange={setRegistrationBody}
            required
          />
          <TextField
            label="HCPC / CSP Registration Number"
            value={registrationNumber}
            onChangeText={setRegistrationNumber}
            placeholder="e.g. PH123456"
            autoCapitalize="characters"
            required
            testID="register-registration-number-input"
          />

          <TextField label="Years of Experience" value={yearsExperience} onChangeText={setYearsExperience} keyboardType="number-pad" testID="register-experience-input" />
          <TextField label="Day Rate (£, optional)" value={dayRate} onChangeText={setDayRate} keyboardType="decimal-pad" testID="register-dayrate-input" />

          <ChipGroup label="Sports You Cover" options={SPORT_OPTIONS.map((s) => ({ value: s, label: s }))} value={sports} onChange={setSports} multi required />
          <TextField label="Other sports (comma-separated)" value={otherSports} onChangeText={setOtherSports} placeholder="e.g. Padel, Climbing" testID="register-other-sports-input" />
        </>
      ) : (
        <>
          <TextField label="Club / Team Name" value={clubName} onChangeText={setClubName} required testID="register-clubname-input" />
          <TextField label="Sport" value={clubSport} onChangeText={setClubSport} placeholder="Football, Rugby, Hockey..." required testID="register-sport-input" />
          <TextField label="Your Name" value={contactName} onChangeText={setContactName} required testID="register-contactname-input" />
          <TextField label="Your Role" value={contactRole} onChangeText={setContactRole} placeholder="Coach, Welfare Officer..." testID="register-contactrole-input" />
          <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" testID="register-phone-input" />
          <TextField label="Home Location" value={clubLocation} onChangeText={setClubLocation} placeholder="Manchester, UK" required testID="register-location-input" />
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title="Create Account" onPress={submit} loading={loading} testID="register-submit-btn" />

      <TouchableOpacity onPress={() => router.replace("/login")} style={styles.switchLink} testID="register-switch-login">
        <Text style={styles.switchText}>
          Already have an account? <Text style={styles.switchBold}>Sign in</Text>
        </Text>
      </TouchableOpacity>
    </Screen>
  );
}

function RoleToggle({ role, onChange }: { role: Role; onChange: (role: Role) => void }) {
  return (
    <TouchableOpacity activeOpacity={1} style={styles.toggleRow}>
      {(["PHYSIO", "CLUB"] as Role[]).map((option) => (
        <TouchableOpacity
          key={option}
          onPress={() => onChange(option)}
          style={[styles.toggleOption, role === option && styles.toggleOptionActive]}
          testID={`register-role-${option.toLowerCase()}`}
        >
          <Text style={[styles.toggleText, role === option && styles.toggleTextActive]}>
            {option === "PHYSIO" ? "Physio" : "Team / Club"}
          </Text>
        </TouchableOpacity>
      ))}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "700", color: colors.text, marginTop: spacing.lg, marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: spacing.sm },
  toggleRow: { flexDirection: "row", backgroundColor: colors.border, borderRadius: radius.md, padding: 4, marginBottom: spacing.lg },
  toggleOption: { flex: 1, paddingVertical: spacing.sm + 2, borderRadius: radius.sm, alignItems: "center" },
  toggleOptionActive: { backgroundColor: colors.surface },
  toggleText: { color: colors.textMuted, fontWeight: "600" },
  toggleTextActive: { color: colors.primary },
  error: { color: colors.danger, marginBottom: spacing.md },
  switchLink: { marginTop: spacing.lg, alignItems: "center" },
  switchText: { color: colors.textMuted },
  switchBold: { color: colors.primary, fontWeight: "700" },
});
