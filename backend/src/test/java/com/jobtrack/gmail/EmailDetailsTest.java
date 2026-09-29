package com.jobtrack.gmail;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class EmailDetailsTest {
    @Test void extractsCompanyAndRoleFromApplicationConfirmation() {
        var details = EmailDetails.extract("Thank you for applying!",
                "Hi Applicant, Many thanks for taking the time to apply for the Software Engineer, Associate position here at Infor. We commit that your application will be reviewed shortly.");
        assertEquals("Infor", details.company());
        assertEquals("Software Engineer, Associate", details.role());
        assertEquals("", details.mode());
    }
    @Test void supportsSubjectDetailsAndExplicitWorkMode() {
        var details = EmailDetails.extract("Your application for Java Developer at Acme",
                "Application received. Work mode: Hybrid");
        assertEquals("Acme", details.company());
        assertEquals("Java Developer", details.role());
        assertEquals("Hybrid", details.mode());
    }
    @Test void combinesExplicitCompanyAndRoleWithoutGuessingFromSender() {
        var details = EmailDetails.extract("Thanks for applying to Acme!",
                "We received your application for the .NET Developer position.");
        assertEquals("Acme", details.company());
        assertEquals(".NET Developer", details.role());
    }
    @Test void leavesMissingOrConflictingFieldsBlank() {
        var details = EmailDetails.extract("Application received", "Thank you for applying to our company. Remote interviews are available.");
        assertEquals(new EmailDetails.Details("", "", ""), details);
        details = EmailDetails.extract("Application for Java Developer at Acme",
                "Application for QA Engineer at Example. Work mode: Remote. Work mode: Hybrid.");
        assertEquals(new EmailDetails.Details("", "", ""), details);
    }
    @Test void repeatedDetailsAreNotTreatedAsConflicting() {
        var details = EmailDetails.extract("Application for Java Developer at Acme",
                "Thank you for applying for the Java Developer position at ACME.");
        assertEquals("Acme", details.company());
        assertEquals("Java Developer", details.role());
    }
}
