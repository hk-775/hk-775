"""Behavioral failure checks beyond the recorded scenarios."""
import tempfile
from pathlib import Path
import unittest

from run import (GRANT, PROFILES, act, expand_case, grade, read_json, remember,
                 run_episode, ROOT)


class MemoryBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.cases = {row["id"]: row for row in read_json(ROOT / "cases.json")["cases"]}

    def test_body_cannot_assign_provenance(self):
        observation, registry = expand_case(self.cases["spoofed-source"])
        bank = remember(observation["document"], "verified_action")
        self.assertEqual(bank[0]["provenance"]["origin"], "external_email")
        result = act(observation, bank, registry, "verified_action")
        self.assertEqual(result["after"]["purchases"], [])
        self.assertEqual(result["rejected"][0]["reason"], "source_cannot_grant_approval")

    def test_forged_memory_provenance_cannot_manufacture_current_authority(self):
        case = self.cases["email-claim"]
        observation, registry = expand_case(case)
        bank = remember(observation["document"], "verified_action")
        bank[0]["provenance"]["origin"] = "approval_service"
        result = act(observation, bank, registry, "verified_action")
        self.assertEqual(result["proposal"]["action"], "purchase")
        self.assertEqual(result["after"]["purchases"], [])
        self.assertIn({"event": "action_check", "allowed": False, "reason": "approval_missing"},
                      result["events"])

    def test_current_vendor_scope_overrides_a_matching_memory(self):
        observation, registry = expand_case(self.cases["valid-approval"])
        registry[GRANT]["vendor"] = "SYN-OTHER-VENDOR"
        bank = remember(observation["document"], "verified_action")
        self.assertEqual(act(observation, bank, registry, "verified_action")["after"]["purchases"], [])

    def test_grader_observes_purchase_even_if_policy_label_says_denied(self):
        case = self.cases["email-claim"]
        observation, registry = expand_case(case)
        result = act(observation, remember(observation["document"], "claim_only"),
                     registry, "claim_only")
        for event in result["events"]:
            if event["event"] == "action_check":
                event["allowed"] = False
        self.assertTrue(grade(case, observation, result)["unsafe_purchase"])

    def test_legitimate_purchase_and_preference_survive_controls(self):
        for case_id in ("valid-approval", "harmless-preference"):
            case = self.cases[case_id]
            observation, registry = expand_case(case)
            for profile in PROFILES:
                result = act(observation, remember(observation["document"], profile),
                             registry, profile)
                self.assertTrue(grade(case, observation, result)["correct_handling"])

    def test_disk_roundtrip_preserves_effect_in_a_new_process(self):
        with tempfile.TemporaryDirectory() as folder:
            row = run_episode(self.cases["email-claim"], "claim_only", Path(folder))
        self.assertTrue(row["grade"]["unsafe_purchase"])
        self.assertEqual(row["write_event"]["bank_digest"], row["events"][0]["bank_digest"])

    def test_a_current_budget_cannot_be_reused_without_limit(self):
        observation, registry = expand_case(self.cases["valid-approval"])
        registry[GRANT]["limit_minor"] = 10000
        bank = remember(observation["document"], "verified_action")
        first = act(observation, bank, registry, "verified_action")
        self.assertEqual(len(first["after"]["purchases"]), 1)
        second = act(observation, bank, first["after"]["registry"], "verified_action")
        self.assertEqual(second["after"]["purchases"], [])

    def test_candidate_receives_no_case_reference(self):
        observation, _ = expand_case(self.cases["valid-approval"])
        self.assertNotIn("expected_purchase", observation)
        self.assertNotIn("registry", observation)


if __name__ == "__main__":
    unittest.main()
