"use client";

import { ProfileAvatarImage } from "@/components/dashboard/profile/profile-avatar";
import { GoldCoinIcon } from "@/lib/dashboard/icons";
import { masteryCohortLabel } from "@/lib/dashboard/mastery-cohort";
import { readStoredProfileAvatarId } from "@/lib/dashboard/profile-avatar";
import {
  PENDING_CONSENT_CHIP,
  type ParentHubChild,
} from "@/lib/parent/parent-hub-children";
import { TRACK_PILL_CLASS } from "@/lib/dashboard/track-pill";
import { cn } from "@/lib/utils/cn";

const CARD_SHADOW = "shadow-[0_4px_24px_-4px_rgb(3_31_130/0.14)]";

function summaryWord(count: number, one: string, many: string) {
  return count === 1 ? one : many;
}

/**
 * One child: avatar, name, track, lifetime lessons, coins to cash in. An
 * active child's card opens their progress in the Hub. A child still
 * waiting for the parent's consent is faded, shows no progress, and never
 * opens it: with an open request it opens that approval instead.
 */
export function ParentHubChildCard({
  child,
  onOpen,
  onReview,
}: {
  child: ParentHubChild;
  /** Active child: open their progress. */
  onOpen?: () => void;
  /** Waiting child with an open request: open the approval. */
  onReview?: () => void;
}) {
  const waiting = child.status === "waiting";
  const onTap = waiting ? onReview : onOpen;
  const avatarId = readStoredProfileAvatarId(
    child.userId,
    child.cohort ?? "explorer",
  );
  // Name gets the whole row next to the avatar (lessons sit at its right
  // edge); the coins pill has its own line under the track tag, so names of
  // ~14+ characters fit at 390px without truncating.
  const Wrapper = onTap ? "button" : "div";
  return (
    <Wrapper
      {...(onTap
        ? {
            type: "button" as const,
            onClick: onTap,
            "aria-label": waiting
              ? `Review ${child.username}'s account. ${PENDING_CONSENT_CHIP}.`
              : `See ${child.username}'s progress`,
            ...(waiting
              ? { "data-parent-tab-child-review": "" }
              : { "data-parent-tab-child-open": "" }),
          }
        : {})}
      data-parent-tab-child={child.username}
      data-parent-tab-child-status={child.status}
      className={cn(
        "grid w-full grid-cols-[56px_1fr] items-center gap-3 rounded-2xl bg-white py-3 pl-3 pr-3.5 text-left",
        onTap && "transition-colors hover:bg-[#F7FBFF] active:bg-[#EEF7FD]",
        CARD_SHADOW,
      )}
    >
      <ProfileAvatarImage
        avatarId={avatarId}
        className={cn("size-14", waiting && "opacity-50 grayscale")}
      />
      <div className="min-w-0">
        <div className={cn("flex items-baseline gap-2", waiting && "opacity-60")}>
          <p
            data-parent-tab-child-name
            className="min-w-0 flex-1 truncate font-heading text-[17px] font-bold leading-tight text-[#031F82]"
          >
            {child.username}
          </p>
          {waiting ? null : (
            <span
              data-parent-tab-child-summary
              className="inline-flex shrink-0 items-center whitespace-nowrap font-sans text-[12.5px] font-medium text-[#1E3A5F]"
            >
              <b className="mr-[3px] font-heading text-sm font-bold text-[#031F82]">
                {child.lessonsDone}
              </b>
              {summaryWord(child.lessonsDone, "lesson", "lessons")}
            </span>
          )}
        </div>
        {waiting ? (
          <>
            <span
              data-parent-tab-child-pending
              className="mt-1 inline-block rounded-full bg-[#FFE7B3] px-[9px] py-0.5 font-heading text-[10px] font-bold uppercase tracking-[0.3px] text-[#8A5300]"
            >
              {PENDING_CONSENT_CHIP}
            </span>
            {onReview ? (
              <p
                data-parent-tab-child-review-hint
                className="mt-1.5 font-sans text-[12.5px] font-medium text-[#1E3A5F]"
              >
                Tap to review in Needs your OK
              </p>
            ) : null}
          </>
        ) : (
          <>
            {child.cohort ? (
              <span
                data-parent-tab-child-track
                className={cn(
                  "mt-1 inline-block rounded-full px-[9px] py-0.5 font-heading text-[10px] font-bold uppercase tracking-[0.3px]",
                  TRACK_PILL_CLASS,
                )}
              >
                {masteryCohortLabel(child.cohort)}
              </span>
            ) : null}
            <div className="mt-1.5">
              <span
                data-parent-tab-child-coins
                className="inline-flex items-center whitespace-nowrap rounded-full bg-[#FFF4DE] py-[3px] pl-1.5 pr-2.5 font-sans text-[12.5px] font-medium text-[#1E3A5F]"
              >
                <GoldCoinIcon className="mr-[5px] size-[15px]" />
                <b className="mr-[3px] font-heading text-sm font-bold text-[#031F82]">
                  {child.coins}
                </b>
                {summaryWord(child.coins, "coin", "coins")} to cash in
              </span>
            </div>
          </>
        )}
      </div>
    </Wrapper>
  );
}
