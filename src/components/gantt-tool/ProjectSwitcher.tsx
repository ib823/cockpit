"use client";

/**
 * The project switcher — the top bar's project control (Composites: the top
 * bar owns the project switcher; nothing project-specific lives anywhere
 * global).
 *
 * A menu button carrying the current project's name opens one dialog that
 * does all four jobs — open, create, rename, delete — because they are one
 * decision ("which plan am I working on?") and four scattered controls made
 * the old header read as a cockpit of unlabelled icons.
 *
 * Delete is a two-step inside the same dialog (arm, then confirm) rather than
 * a browser confirm(): the destructive step names its object and stays on the
 * same surface as the list it removes from.
 */

import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ds/Button";
import { Modal } from "@/components/ds/Modal";
import { Input } from "@/components/ds/Input";
import styles from "./ProjectSwitcher.module.css";

export interface SwitcherProject {
  id: string;
  name: string;
  updatedAt: string | Date;
}

export interface ProjectSwitcherProps {
  currentProject: SwitcherProject;
  projects: SwitcherProject[];
  onSelectProject: (projectId: string) => Promise<void>;
  onCreateProject: () => void;
  onUpdateProjectName: (name: string) => Promise<void>;
  onDeleteProject?: (projectId: string) => Promise<void>;
  isLoading?: boolean;
}

export function ProjectSwitcher({
  currentProject,
  projects,
  onSelectProject,
  onCreateProject,
  onUpdateProjectName,
  onDeleteProject,
  isLoading,
}: ProjectSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentProject.name);
  const [renaming, setRenaming] = useState(false);
  const [armedDelete, setArmedDelete] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const openDialog = () => {
    setName(currentProject.name);
    setArmedDelete(null);
    setOpen(true);
  };

  const commitRename = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === currentProject.name) return;
    setRenaming(true);
    try {
      await onUpdateProjectName(trimmed);
    } finally {
      setRenaming(false);
    }
  };

  return (
    <>
      <Button menu expanded={open} variant="ghost" size="sm" onClick={openDialog}>
        <span className={styles.buttonName}>{currentProject.name}</span>
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Projects"
        description="Open, rename or remove a plan."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setOpen(false);
                onCreateProject();
              }}
            >
              New project
            </Button>
          </>
        }
      >
        <div className={styles.renameRow}>
          <Input
            label="Project name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void commitRename();
            }}
          />
          <Button
            variant="secondary"
            loading={renaming}
            loadingLabel="Saving…"
            disabled={!name.trim() || name.trim() === currentProject.name}
            onClick={() => void commitRename()}
          >
            Rename
          </Button>
        </div>

        <ul className={styles.list}>
          {projects.map((project) => {
            const isCurrent = project.id === currentProject.id;
            const armed = armedDelete === project.id;
            return (
              <li key={project.id} className={styles.item}>
                <div className={styles.itemText}>
                  <span className={styles.itemName}>
                    {project.name}
                    {isCurrent && <span className={styles.current}> · current</span>}
                  </span>
                  <span className={styles.itemMeta}>
                    Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                  </span>
                </div>
                {!isCurrent && (
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busyId === project.id}
                    loadingLabel="Opening…"
                    disabled={isLoading}
                    onClick={async () => {
                      setBusyId(project.id);
                      try {
                        await onSelectProject(project.id);
                        setOpen(false);
                      } finally {
                        setBusyId(null);
                      }
                    }}
                  >
                    Open
                  </Button>
                )}
                {onDeleteProject && !isCurrent && (
                  armed ? (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={async () => {
                        await onDeleteProject(project.id);
                        setArmedDelete(null);
                      }}
                    >
                      Delete “{project.name}”?
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => setArmedDelete(project.id)}>
                      Delete
                    </Button>
                  )
                )}
              </li>
            );
          })}
        </ul>
      </Modal>
    </>
  );
}
