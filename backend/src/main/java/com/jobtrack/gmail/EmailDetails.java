package com.jobtrack.gmail;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

public final class EmailDetails {
    private EmailDetails() {}
    public record Details(String company, String role, String mode) {}
    private static final String END_COMPANY = "(?=[.!?;\\n]|$|\\s+(?:for\\s+the|we\\b|your\\b|our\\b))";
    private static final String END_ROLE = "(?=[.!?;\\n]|$|\\s+(?:at|with|we\\b|your\\b|our\\b))";
    private static final Pattern[] PAIRS = {
        rule("(?:apply|applied|applying) for (?:the )?(.{2,150}?) (?:position|role)(?: here)? (?:at|with) (.{2,100}?)" + END_COMPANY),
        rule("(?:application for|applying for|applied for) (?:the )?(.{2,150}?)(?: (?:position|role)(?: here)?)? at (.{2,100}?)" + END_COMPANY)
    };
    private static final Pattern POSITION_OF_ROLE = rule("(?:application for|applying for|applied for|apply for) (?:the )?position of (.{2,150}?)" + END_ROLE);
    private static final Pattern ROLE = rule("(?:application for|applying for|applied for|apply for) (?:the )?(.{2,150}?) (?:position|role)\\b");
    private static final Pattern COMPANY = rule("(?:thank you for applying|thanks for applying|your application) (?:to|with) (.{2,100}?)" + END_COMPANY);
    private static final Pattern MODE = rule("\\b(?:work mode|work arrangement|workplace type)\\s*:\\s*(remote|hybrid|on[- ]site)\\b");

    public static Details extract(String subject, String snippet) {
        Map<String, String> subjectCompanies = new LinkedHashMap<>(), subjectRoles = new LinkedHashMap<>(),
                subjectModes = new LinkedHashMap<>();
        Map<String, String> snippetCompanies = new LinkedHashMap<>(), snippetRoles = new LinkedHashMap<>(),
                snippetModes = new LinkedHashMap<>();
        collect(subject, subjectCompanies, subjectRoles, subjectModes);
        collect(snippet, snippetCompanies, snippetRoles, snippetModes);

        String company = firstClear(subjectCompanies, snippetCompanies);
        String role = firstClear(subjectRoles, snippetRoles);
        String mode = firstClear(subjectModes, snippetModes);
        return new Details(company, role, mode);
    }

    private static void collect(String source, Map<String, String> companies,
            Map<String, String> roles, Map<String, String> modes) {
        String text = source == null ? "" : source.replaceAll("[\\t\\r ]+", " ");
        for (Pattern pattern : PAIRS) {
            var matcher = pattern.matcher(text);
            while (matcher.find()) {
                add(roles, matcher.group(1), false);
                add(companies, matcher.group(2), true);
            }
        }
        var positionOfRole = POSITION_OF_ROLE.matcher(text);
        while (positionOfRole.find()) add(roles, positionOfRole.group(1), false);
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

    private static String firstClear(Map<String, String> preferred, Map<String, String> fallback) {
        String value = single(preferred);
        if (!value.isBlank()) return value;
        if (preferred.size() > 1) return "";
        return single(fallback);
    }

    private static void add(Map<String, String> values, String raw, boolean company) {
        String value = raw.trim().replaceAll("^[\\\"“‘]+|[\\\"”’]+$", "").trim();
        if (!company) {
            value = value.replaceFirst("(?i)^(?:the\\s+)?position\\s+of\\s+", "");
            value = value.replaceFirst("(?i)[.!?;]\\s+(?=(?:our|we|your|this|you)\\b).*$", "");
            value = value.replaceFirst("[.!?;]+$", "").trim();
        }
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
