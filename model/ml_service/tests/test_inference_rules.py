import unittest

from main import InferenceEngine


class InferenceRulesTests(unittest.TestCase):
    def test_eye_closure_emits_one_event_per_continuous_closure(self) -> None:
        state = {
            "eye_closed_seconds": 2.7,
            "yawn_seconds": 0.0,
            "distracted_seconds": 0.0,
            "eye_event_sent": False,
            "yawn_event_sent": False,
            "distraction_event_sent": False,
        }

        first = InferenceEngine._events(state, True, False, False)
        second = InferenceEngine._events(state, True, False, False)

        self.assertEqual(len(first), 1)
        self.assertEqual(first[0]["type"], "EYE_CLOSURE")
        self.assertEqual(second, [])

    def test_signal_reset_allows_a_new_event_after_recovery(self) -> None:
        state = {
            "eye_closed_seconds": 0.0,
            "yawn_seconds": 0.0,
            "distracted_seconds": 0.0,
            "eye_event_sent": True,
            "yawn_event_sent": False,
            "distraction_event_sent": False,
        }

        InferenceEngine._events(state, False, False, False)
        state["eye_closed_seconds"] = 2.6

        events = InferenceEngine._events(state, True, False, False)

        self.assertEqual([event["type"] for event in events], ["EYE_CLOSURE"])


if __name__ == "__main__":
    unittest.main()
