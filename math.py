import random
import time


TIME_LIMIT = 10
TOTAL_QUESTIONS = 10
MIN_NUMBER = 1
MAX_NUMBER = 40


def generate_question():
    """Generate a random math question and return the question with its answer."""

    a = random.randint(MIN_NUMBER, MAX_NUMBER)
    b = random.randint(MIN_NUMBER, MAX_NUMBER)
    operation = random.choice(["+", "-", "*", "/"])

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


def run_quiz():
    """Run the complete math quiz."""

    score = 0

    print("\nWelcome to the Math Quiz!")
    print(f"You have {TIME_LIMIT} seconds for each question.")
    print(f"You will get {TOTAL_QUESTIONS} questions.")
    print("Type 'exit' at any time to quit.\n")

    for question_number in range(1, TOTAL_QUESTIONS + 1):

        question, correct_answer, operation = generate_question()

        print(f"Question {question_number}/{TOTAL_QUESTIONS}")

        start_time = time.monotonic()

        user_input = input(f"{question} = ").strip()

        time_taken = time.monotonic() - start_time

        if user_input.lower() == "exit":
            print("\nQuiz ended.")
            break

        if time_taken > TIME_LIMIT:
            print(
                f"\nTime's up! "
                f"You took {time_taken:.2f} seconds."
            )
            break

        if not user_input:
            print("Please enter an answer.\n")
            continue

        if check_answer(
            user_input,
            correct_answer,
            operation
        ):
            score += 1
            print("Correct! ✓\n")

        else:
            print(
                f"Wrong answer. "
                f"The correct answer was {correct_answer}.\n"
            )

    print("=" * 35)
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

    print("=" * 35)


if __name__ == "__main__":
    run_quiz()