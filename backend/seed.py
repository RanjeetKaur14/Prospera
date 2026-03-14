# import models
# from database import SessionLocal, engine

# # Base.metadata.create_all is already handled by main.py or manually if needed
# # but we can call it safely if we import Base from models

# def seed():
#     db = SessionLocal()
#     try:
#         if db.query(models.Course).first():
#             print("Data already seeded")
#             return
        
#         # 1. Financial Foundations
#         c1 = models.Course(title="Financial Foundations", description="The basics of money management.", order=1)
#         db.add(c1)
#         db.flush()
        
#         m1 = models.Module(course_id=c1.id, title="What is Money?", content="### Introduction\nMoney is a medium of exchange that allows us to trade goods and services without bartering. It must be durable, portable, divisible, and scarce.", examples="Example: Instead of trading 3 chickens for a bag of grain, you use currency.", order=1)
#         db.add(m1)
#         db.flush()
        
#         q1 = models.Quiz(module_id=m1.id, title="Money Basics Quiz")
#         db.add(q1)
#         db.flush()
        
#         db.add(models.QuizQuestion(
#             quiz_id=q1.id, 
#             question_text="What is a key characteristic of money?", 
#             options='["It must be made of gold", "It must be edible", "It must be divisible", "It must be heavy"]', 
#             correct_option_index=2,
#             explanation="Divisibility allows money to be used for transactions of different sizes."
#         ))

#         # Diagnostic Quiz for Course 1
#         dq1 = models.Quiz(course_id=c1.id, title="Foundations Diagnostic", is_diagnostic=True)
#         db.add(dq1)
#         db.flush()
#         db.add(models.QuizQuestion(
#             quiz_id=dq1.id,
#             question_text="What is inflation?",
#             options='["When prices go down", "The increase in purchasing power", "The decrease in purchasing power over time", "A type of bubble wrap"]',
#             correct_option_index=2,
#             explanation="Inflation makes your money worth less over time."
#         ))
        
#         # 2. Smart Spending
#         c2 = models.Course(title="Smart Spending", description="Learn to differentiate needs vs wants.", order=2)
#         db.add(c2)
#         db.flush()

#         m2 = models.Module(course_id=c2.id, title="Needs vs Wants", content="A need is something essential for survival (food, shelter). A want is something that improves quality of life but is not essential.", order=1)
#         db.add(m2)

#         db.commit()
#         print("Successfully seeded initial courses")
#     finally:
#         db.close()

# if __name__ == "__main__":
#     seed()
import models
from database import SessionLocal

def seed():
    db = SessionLocal()

    try:
        if db.query(models.Course).first():
            print("Already seeded")
            return

        # -------------------------
        # CHILD BRACKET
        # -------------------------

        # Beginner Course 1
        c1 = models.Course(
            title="Treasure of Money",
            description="Learn what money is and why people use it.",
            bracket="Bracket 1",
            level_tier="Beginner",
            order=1
        )
        db.add(c1)
        db.flush()

        slides = """
        [
          {"type":"slide","text":"Welcome young explorer! Today we discover money."},
          {"type":"slide","text":"Money is something we use to buy things."},
          {"type":"dragon","text":"🐉 Did you know? Before money, people traded chickens for bread!"},
          {"type":"visual","chart":"barter_example"},
          {"type":"slide","text":"Money makes trade easier."}
        ]
        """

        m1 = models.Module(
            course_id=c1.id,
            title="What is Money?",
            content=slides,
            examples="Example: You use coins to buy candy.",
            order=1
        )
        db.add(m1)
        db.flush()

        q1 = models.Quiz(module_id=m1.id, title="Money Explorer Quiz")
        db.add(q1)
        db.flush()

        db.add(models.QuizQuestion(
            quiz_id=q1.id,
            question_text="What do we use money for?",
            options='["To buy things","To eat","To throw away"]',
            correct_option_index=0,
            explanation="Money helps us buy goods and services."
        ))

        # Beginner Course 2
        c2 = models.Course(
            title="Saving Your Gold",
            description="Learn how to save money wisely.",
            bracket="Bracket 1",
            level_tier="Beginner",
            order=2
        )
        db.add(c2)
        db.flush()

        slides = """
        [
          {"type":"slide","text":"Imagine you get 10 gold coins."},
          {"type":"slide","text":"You can spend all of them... or save some."},
          {"type":"dragon","text":"🐉 Smart explorers save coins for future adventures."},
          {"type":"visual","chart":"saving_growth"}
        ]
        """

        m2 = models.Module(
            course_id=c2.id,
            title="Why Save Money?",
            content=slides,
            order=1
        )
        db.add(m2)
        db.flush()

        q2 = models.Quiz(module_id=m2.id, title="Saving Quiz")
        db.add(q2)
        db.flush()

        db.add(models.QuizQuestion(
            quiz_id=q2.id,
            question_text="Why should we save money?",
            options='["For emergencies","To lose it","No reason"]',
            correct_option_index=0,
            explanation="Savings help us in emergencies."
        ))

        # Intermediate Course
        c3 = models.Course(
            title="Spending Wisely",
            description="Understand needs vs wants.",
            bracket="Bracket 1",
            level_tier="Intermediate",
            order=3
        )
        db.add(c3)
        db.flush()

        slides = """
        [
          {"type":"slide","text":"Some things are NEEDS."},
          {"type":"slide","text":"Some things are WANTS."},
          {"type":"dragon","text":"🐉 Food is a need. A toy dragon is a want."},
          {"type":"visual","chart":"needs_vs_wants"}
        ]
        """

        m3 = models.Module(
            course_id=c3.id,
            title="Needs vs Wants",
            content=slides,
            order=1
        )
        db.add(m3)

        # Advanced Course
        c4 = models.Course(
            title="First Investment Adventure",
            description="Learn how money grows.",
            bracket="Bracket 1",
            level_tier="Advanced",
            order=4
        )
        db.add(c4)
        db.flush()

        slides = """
        [
          {"type":"slide","text":"Money can grow when invested."},
          {"type":"slide","text":"Imagine planting a money tree."},
          {"type":"dragon","text":"🐉 Invest wisely and your treasure multiplies."},
          {"type":"visual","chart":"compound_interest"}
        ]
        """

        m4 = models.Module(
            course_id=c4.id,
            title="Growing Your Money",
            content=slides,
            order=1
        )
        db.add(m4)

        # -------------------------
        # CHILD FINAL TEST
        # -------------------------

        final_test = models.Course(
            title="Child Mastery Test",
            description="Final challenge to unlock Young Professional level.",
            bracket="Bracket 1",
            level_tier="Advanced",
            is_placement_test=True,
            order=5
        )
        db.add(final_test)
        db.flush()

        quiz = models.Quiz(
            course_id=final_test.id,
            title="Child Final Quiz",
            is_diagnostic=True
        )
        db.add(quiz)
        db.flush()

        db.add(models.QuizQuestion(
            quiz_id=quiz.id,
            question_text="Saving money helps us:",
            options='["Be prepared","Lose money","Spend everything"]',
            correct_option_index=0
        ))

        # -------------------------
        # YOUNG PROFESSIONAL
        # -------------------------

        yp_test = models.Course(
            title="Young Professional Placement Test",
            description="Take this test if you finished Child level.",
            bracket="Bracket 2",
            level_tier="Beginner",
            is_placement_test=True,
            order=1
        )
        db.add(yp_test)
        db.flush()

        quiz = models.Quiz(
            course_id=yp_test.id,
            title="Placement Quiz",
            is_diagnostic=True
        )
        db.add(quiz)
        db.flush()

        db.add(models.QuizQuestion(
            quiz_id=quiz.id,
            question_text="Which is a NEED?",
            options='["Food","Video games","Candy"]',
            correct_option_index=0
        ))

        # Young Professional Beginner Course
        yp_course = models.Course(
            title="Budgeting Basics",
            description="Learn how to manage your first salary.",
            bracket="Bracket 2",
            level_tier="Beginner",
            order=2
        )
        db.add(yp_course)
        db.flush()

        slides = """
        [
          {"type":"slide","text":"You just got your first salary."},
          {"type":"dragon","text":"🐉 Don't spend it all at once!"},
          {"type":"visual","chart":"budget_split"}
        ]
        """

        module = models.Module(
            course_id=yp_course.id,
            title="Introduction to Budgeting",
            content=slides,
            order=1
        )
        db.add(module)

        db.commit()
        print("Courses seeded successfully!")

    finally:
        db.close()


if __name__ == "__main__":
    seed()