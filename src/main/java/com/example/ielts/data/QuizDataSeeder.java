package com.example.ielts.data;

import com.example.ielts.entity.QuizQuestion;
import com.example.ielts.entity.QuizTest;
import com.example.ielts.repo.QuizQuestionRepository;
import com.example.ielts.repo.QuizTestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class QuizDataSeeder {

    private static final Logger log = LoggerFactory.getLogger(QuizDataSeeder.class);

    private final QuizTestRepository testRepo;
    private final QuizQuestionRepository questionRepo;

    public QuizDataSeeder(QuizTestRepository testRepo, QuizQuestionRepository questionRepo) {
        this.testRepo = testRepo;
        this.questionRepo = questionRepo;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedDefaultTests() {
        seedLevel("BEGINNER",    beginnerQuestions());
        seedLevel("ELEMENTARY",  elementaryQuestions());
        seedLevel("PRE_IELTS",   preIeltsQuestions());
        seedLevel("IELTS_READY", ieltsReadyQuestions());
        seedLevel("ADVANCED",    advancedQuestions());
    }

    private void seedLevel(String level, List<Q> questions) {
        // Check if a default test for this level already exists
        boolean exists = testRepo.findByApproved(true).stream()
                .anyMatch(t -> level.equals(t.getLevel()) && "ADMIN".equals(t.getCreatedByRole()));
        if (exists) {
            log.info("Default {} test already exists, skipping seed", level);
            return;
        }

        QuizTest test = new QuizTest();
        test.setTitle("IELTS " + levelLabel(level) + " — Grammar & Vocabulary");
        test.setLevel(level);
        test.setCreatedByRole("ADMIN");
        test.setApproved(true);
        QuizTest saved = testRepo.save(test);

        int idx = 0;
        for (Q q : questions) {
            QuizQuestion qq = new QuizQuestion();
            qq.setTestId(saved.getTestId());
            qq.setQuestionText(q.text);
            qq.setOptionA(q.a);
            qq.setOptionB(q.b);
            qq.setOptionC(q.c);
            qq.setOptionD(q.d);
            qq.setCorrectOption(q.correct);
            qq.setOrderIndex(idx++);
            questionRepo.save(qq);
        }
        log.info("Seeded {} test: '{}' ({} questions)", level, saved.getTitle(), questions.size());
    }

    private String levelLabel(String level) {
        return switch (level) {
            case "BEGINNER"    -> "Beginner";
            case "ELEMENTARY"  -> "Elementary";
            case "PRE_IELTS"   -> "Pre-IELTS";
            case "IELTS_READY" -> "IELTS Ready";
            case "ADVANCED"    -> "Advanced";
            default -> level;
        };
    }

    // ── Questions ─────────────────────────────────────────────────────────────

    private record Q(String text, String a, String b, String c, String d, String correct) {}

    private List<Q> beginnerQuestions() {
        return List.of(
            new Q("She ___ a student.", "am", "is", "are", "be", "B"),
            new Q("They ___ at school every day.", "go", "goes", "going", "went", "A"),
            new Q("___ you like coffee?", "Do", "Does", "Are", "Is", "A"),
            new Q("I ___ a book right now.", "read", "reads", "am reading", "is reading", "C"),
            new Q("He ___ not speak French.", "do", "does", "is", "are", "B"),
            new Q("There ___ two cats in the garden.", "is", "are", "was", "be", "B"),
            new Q("___ is your name?", "Who", "What", "Where", "How", "B"),
            new Q("She has ___ apple in her hand.", "a", "an", "the", "some", "B"),
            new Q("___ you from Uzbekistan?", "Is", "Am", "Are", "Do", "C"),
            new Q("My sister ___ TV in the evenings.", "watch", "watches", "watching", "watched", "B")
        );
    }

    private List<Q> elementaryQuestions() {
        return List.of(
            new Q("He ___ to the gym yesterday.", "go", "goes", "went", "gone", "C"),
            new Q("I have ___ been to London.", "ever", "never", "always", "yet", "B"),
            new Q("She was ___ when the phone rang.", "sleep", "sleeping", "slept", "sleeps", "B"),
            new Q("They ___ here for three years.", "live", "lived", "have lived", "are living", "C"),
            new Q("___ he have a car?", "Do", "Does", "Is", "Has", "B"),
            new Q("The weather is ___ today than yesterday.", "more cold", "coldest", "colder", "most cold", "C"),
            new Q("She is ___ than her brother.", "tall", "more tall", "taller", "tallest", "C"),
            new Q("I ___ dinner when she arrived.", "cooked", "was cooking", "cook", "have cooked", "B"),
            new Q("You should ___ more water.", "drink", "to drink", "drinking", "drank", "A"),
            new Q("___ of the students passed the exam.", "Much", "Many", "A lot", "Every", "B")
        );
    }

    private List<Q> preIeltsQuestions() {
        return List.of(
            new Q("The report ___ by the manager last week.", "wrote", "was written", "has written", "is writing", "B"),
            new Q("If I ___ more time, I would study harder.", "have", "had", "has", "will have", "B"),
            new Q("The number of students ___ increased significantly.", "have", "has", "is", "are", "B"),
            new Q("She suggested ___ the meeting.", "postpone", "to postpone", "postponing", "postponed", "C"),
            new Q("Despite ___ hard, he failed the exam.", "studying", "study", "studied", "to study", "A"),
            new Q("The research ___ out in 2020.", "carried", "was carried", "has carried", "carry", "B"),
            new Q("He is ___ to the problem than we thought.", "more close", "closer", "closest", "close enough", "B"),
            new Q("___ the heavy rain, the match continued.", "Despite", "Although", "However", "Because", "A"),
            new Q("By the time she arrived, we ___ for an hour.", "waited", "have waited", "had been waiting", "wait", "C"),
            new Q("The data ___ that pollution levels are rising.", "suggest", "suggests", "suggested", "suggesting", "B")
        );
    }

    private List<Q> ieltsReadyQuestions() {
        return List.of(
            new Q("The government has implemented policies ___ reduce carbon emissions.", "to", "for", "in order", "so as", "A"),
            new Q("___ is widely acknowledged that climate change poses a significant threat.", "This", "It", "There", "That", "B"),
            new Q("The findings ___ a strong correlation between diet and health.", "demonstrate", "demonstrated", "are demonstrating", "demonstrating", "A"),
            new Q("Had they invested earlier, they ___ greater profits.", "would make", "made", "would have made", "will make", "C"),
            new Q("The extent ___ globalisation affects local cultures is debated.", "to which", "which", "that", "to that", "A"),
            new Q("Not only ___ the policy controversial, but it was also costly.", "is", "was", "had", "did", "B"),
            new Q("The infrastructure ___ developed over the past decade.", "has considerably been", "has been considerably", "considerably has been", "been considerably", "B"),
            new Q("___ the advantages, there are also significant drawbacks.", "Alongside", "Moreover", "Therefore", "Subsequently", "A"),
            new Q("The proposal was met with ___ opposition from the public.", "considerable", "considerably", "more considerable", "considering", "A"),
            new Q("Researchers have yet ___ a definitive solution to the problem.", "find", "finding", "to find", "found", "C")
        );
    }

    private List<Q> advancedQuestions() {
        return List.of(
            new Q("The phenomenon ___ by scientists for decades without a clear explanation.", "has been studied", "was studied", "had studied", "studied", "A"),
            new Q("___ his academic credentials, his practical experience is equally impressive.", "In spite of", "Notwithstanding", "As a result of", "Owing to", "B"),
            new Q("The committee recommended that the proposal ___ further consideration.", "receives", "received", "receive", "would receive", "C"),
            new Q("The extent ___ artificial intelligence will reshape the workforce remains uncertain.", "at which", "to which", "by which", "with which", "B"),
            new Q("___ scrutiny of the data reveals several inconsistencies.", "Closely", "Close", "Closer", "Closest", "B"),
            new Q("The more resources are allocated, ___ the outcomes tend to be.", "better", "the better", "best", "much better", "B"),
            new Q("The legislation was criticised for its ___ ambiguous wording.", "seemingly", "seeming", "seemed", "seem", "A"),
            new Q("It was not until the 21st century ___ renewable energy became mainstream.", "when", "that", "which", "where", "B"),
            new Q("The author argues, ___ unconvincingly, that technology is inherently neutral.", "rather", "rather than", "either", "neither", "A"),
            new Q("___ the two theories appears to fully account for all observed phenomena.", "Either of", "Neither of", "Both of", "Each of", "B")
        );
    }
}
