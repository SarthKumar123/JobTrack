package com.jobtrack.gmail;

import java.util.Locale;

public final class EmailRules {
    private EmailRules() {}
    public record Match(String stage, String reason) {}
    public static Match classify(String subject, String snippet) {
        String text = (subject + " " + snippet).toLowerCase(Locale.ROOT);
        if (contains(text, "job alert", "recommended jobs", "jobs for you", "unsubscribe from job alerts")) return null;
        if (contains(text, "not moving forward", "not be moving forward", "application was unsuccessful",
                "not been selected", "decided to move forward with other", "unable to offer", "application rejected"))
            return new Match("Rejected", "A rejection phrase was found.");
        if (contains(text, "offer of employment", "pleased to offer you", "offer letter", "job offer"))
            return new Match("Offer", "An employment offer phrase was found.");
        if (contains(text, "invite you to an interview", "interview invitation", "schedule an interview",
                "interview scheduled", "interview confirmation"))
            return new Match("Interview", "An interview invitation or scheduling phrase was found.");
        if (contains(text, "online assessment", "coding assessment", "technical assessment", "screening call"))
            return new Match("Screening", "An assessment or screening phrase was found.");
        if (contains(text, "application received", "received your application", "thank you for applying",
                "thanks for applying", "application submitted"))
            return new Match("Applied", "An application confirmation phrase was found.");
        return null;
    }
    private static boolean contains(String text, String... phrases) {
        for (String phrase : phrases) if (text.contains(phrase)) return true;
        return false;
    }
}
