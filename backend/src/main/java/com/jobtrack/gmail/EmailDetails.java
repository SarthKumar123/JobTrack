package com.jobtrack.gmail;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

public final class EmailDetails {
    private EmailDetails() {}
    public record Details(String company, String role, String mode) {}
    private static final String END_COMPANY = "(?=[.!?;\\n]|$|\\s+(?:for\\s+the|we\\b|your\\b|our\\b))";
    private static final Pattern[] PAIRS = {
        rule("(?:apply|applied|applying) for (?:the )?(.{2,150}?) (?:position|role)(?: here)? (?:at|with) (.{2,100}?)" + END_COMPANY),
        rule("(?:application for|applying for|applied for) (?:the )?(.{2,150}?)(?: (?:position|role)(?: here)?)? at (.{2,100}?)" + END_COMPANY)
    };
    private static final Pattern ROLE = rule("(?:application for|applying for|applied for|apply for) (?:the )?(.{2,150}?) (?:position|role)\\b");
    private static final Pattern COMPANY = rule("(?:thank you for applying|thanks for applying|your application) (?:to|with) (.{2,100}?)" + END_COMPANY);
    private static final Pattern MODE = rule("\\b(?:work mode|work arrangement|workplace type)\\s*:\\s*(remote|hybrid|on[- ]site)\\b");

    public static Details extract(String subject, String snippet) {
        Map<String, String> companies = new LinkedHashMap<>(), roles = new LinkedHashMap<>(), modes = new LinkedHashMap<>();
        for (String source : new String[] { subject, snippet }) {
            String text = source == null ? "" : source.replaceAll("[\\t\\r ]+", " ");
            for (Pattern pattern : PAIRS) {
                var matcher = pattern.matcher(text);
                while (matcher.find()) {
                    add(roles, matcher.group(1), false);
                    add(companies, matcher.group(2), true);
                }
            }
            var role = ROLE.matcher(text);
            while (role.find()) add(roles, role.group(1), false);
            var company = COMPANY.matcher(text);
            while (company.find()) add(companies, company.group(1), true);
            var mode = MODE.matcher(text);
            while (mode.find()) {
                String value = switch (mode.group(1).toLowerCase(Locale.ROOT)) {
                    case "remote" -> "Remote";
                    case "hybrid" -> "Hybrid";
                    default -> "On-site";
                };
                modes.put(value, value);
            }
        }
        return new Details(single(companies), single(roles), single(modes));
    }

    private static void add(Map<String, String> values, String raw, boolean company) {
        String value = raw.trim().replaceAll("^[\\\"“‘]+|[\\\"”’]+$", "").trim();
        String key = value.toLowerCase(Locale.ROOT);
        if (value.isBlank() || !value.matches(".*[\\p{L}].*") || value.contains("@")
                || value.contains("http") || value.contains("<") || value.contains(">")
                || key.matches("(?:our|the|this|your|a|an)\\s+.*")
                || key.matches("us|them|company|team|position|role|job|opportunity")
                || value.length() > (company ? 100 : 150)) return;
        values.putIfAbsent(key, value);
    }
    private static String single(Map<String, String> values) {
        return values.size() == 1 ? values.values().iterator().next() : "";
    }
    private static Pattern rule(String value) {
        return Pattern.compile(value, Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    }
}
