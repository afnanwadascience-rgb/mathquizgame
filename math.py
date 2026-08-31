import random
import time


TIME_LIMIT = 10
TOTAL_QUESTIONS = 10
MIN_NUMBER = 1
MAX_NUMBER = 40

DIFFICULTY = {
    "easy": (1, 10),
    "medium": (1, 100),
    "hard": (1, 1000),
}

OPERATIONS = {
    "1": ["+"],
    "2": ["-"],
    "3": ["*"],
    "4": ["/"],
    "5": ["+", "-", "*", "/"],
}


def generate_question(min_number=MIN_NUMBER, max_number=MAX_NUMBER, operations=None):
    """Generate a random math question and return the question with its answer."""

    if operations is None:
        operations = ["+", "-", "*", "/"]

    a = random.randint(min_number, max_number)
    b = random.randint(min_number, max_number)
    operation = random.choice(operations)

    if operation == "+":
        correct_answer = a + b

    elif operation == "-":
        correct_answer = a - b

    elif operation == "*":
        correct_answer = a * b

    else:
        correct_answer = round(a / b, 2)

    return f"{a} {operation} {b}", correct_answer, operation


def check_answer(user_input, correct_answer, operation):
    """Convert and validate the user's answer."""

    try:
        if operation == "/":
            user_answer = float(user_input)
            return abs(user_answer - correct_answer) < 0.01

        user_answer = int(user_input)
        return user_answer == correct_answer

    except ValueError:
        return False


def multiplier_for(streak):
    if streak >= 50:
        return 10
    if streak >= 25:
        return 5
    if streak >= 10:
        return 3
    if streak >= 5:
        return 2
    return 1


def choose_settings():
    print("\nDifficulty: easy / medium / hard / custom / classic")
    difficulty = input("Choose difficulty [classic]: ").strip().lower() or "classic"

    if difficulty == "classic":
        min_number, max_number = MIN_NUMBER, MAX_NUMBER
    elif difficulty == "custom":
        try:
            min_number = int(input("Minimum: ").strip())
            max_number = int(input("Maximum: ").strip())
        except ValueError:
            print("Invalid range. Using classic 1-40.")
            min_number, max_number = MIN_NUMBER, MAX_NUMBER
        if min_number >= max_number or min_number < 0:
            print("Invalid range. Using classic 1-40.")
            min_number, max_number = MIN_NUMBER, MAX_NUMBER
    elif difficulty in DIFFICULTY:
        min_number, max_number = DIFFICULTY[difficulty]
    else:
        print("Unknown difficulty. Using classic 1-40.")
        min_number, max_number = MIN_NUMBER, MAX_NUMBER

    print("\n1 Addition  2 Subtraction  3 Multiplication  4 Division  5 Mixed")
    op_choice = input("Choose operation [5]: ").strip() or "5"
    operations = OPERATIONS.get(op_choice, OPERATIONS["5"])

    print("\nModes: classic (10 questions, 10s each) / timed / endless")
    mode = input("Choose mode [classic]: ").strip().lower() or "classic"
    duration = 60
    if mode == "timed":
        raw = input("Duration 60, 90, or 120 seconds [60]: ").strip() or "60"
        duration = int(raw) if raw in {"60", "90", "120"} else 60

    return min_number, max_number, operations, mode, duration


def run_quiz():
    """Run the complete math quiz."""

    min_number, max_number, operations, mode, duration = choose_settings()

    score = 0
    streak = 0
    wrong = 0
    asked = 0

    print("\nWelcome to the Math Quiz!")
    if mode == "classic":
        print(f"You have {TIME_LIMIT} seconds for each question.")
        print(f"You will get {TOTAL_QUESTIONS} questions.")
    elif mode == "timed":
        print(f"Timed mode: {duration} seconds total.")
    else:
        print("Endless mode: game ends after 3 wrong answers.")
    print("Type 'exit' at any time to quit.\n")

    start_all = time.monotonic()
    question_number = 0

    while True:
        if mode == "classic" and question_number >= TOTAL_QUESTIONS:
            break
        if mode == "timed" and time.monotonic() - start_all >= duration:
            print("\nTime's up!")
            break
        if mode == "endless" and wrong >= 3:
            print("\nReached 3 wrong answers.")
            break

        question_number += 1
        question, correct_answer, operation = generate_question(
            min_number, max_number, operations
        )

        if mode == "classic":
            print(f"Question {question_number}/{TOTAL_QUESTIONS}")
        else:
            print(f"Question {question_number} | Score {score} | Streak {streak} | Combo {multiplier_for(streak)}x")

        start_time = time.monotonic()
        user_input = input(f"{question} = ").strip()
        time_taken = time.monotonic() - start_time

        if user_input.lower() == "exit":
            print("\nQuiz ended.")
            break

        if mode == "classic" and time_taken > TIME_LIMIT:
            print(f"\nTime's up! You took {time_taken:.2f} seconds.")
            break

        if not user_input:
            print("Please enter an answer.\n")
            continue

        asked += 1
        if check_answer(user_input, correct_answer, operation):
            streak += 1
            gained = multiplier_for(streak)
            score += gained
            print(f"Correct! +{gained}  Streak {streak}\n")
        else:
            wrong += 1
            streak = 0
            print(f"Wrong answer. The correct answer was {correct_answer}.\n")

    print("=" * 35)
    if mode == "classic":
        print(f"Final Score: {score}/{TOTAL_QUESTIONS}")
        percentage = (score / TOTAL_QUESTIONS) * 100
        print(f"Score: {percentage:.0f}%")
        if score == TOTAL_QUESTIONS:
            print("Perfect score! Excellent work!")
        elif percentage >= 70:
            print("Great job!")
        elif percentage >= 40:
            print("Good effort. Keep practicing!")
        else:
            print("Keep practicing and try again!")
    else:
        print(f"Final Score: {score}")
        print(f"Answered: {asked}")
        print(f"Wrong: {wrong}")
    print("=" * 35)


if __name__ == "__main__":
    run_quiz()