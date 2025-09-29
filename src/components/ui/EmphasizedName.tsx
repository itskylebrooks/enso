import type { ReactElement } from 'react';

export const EmphasizedName = ({ name }: { name: string }): ReactElement => {
  const splitIndex = name.indexOf(' ');
  if (splitIndex === -1) {
    return <strong className="font-semibold">{name}</strong>;
  }

  const left = name.slice(0, splitIndex + 1);
  const right = name.slice(splitIndex + 1);

  return (
    <span>
      {left}
      <strong className="font-semibold">{right}</strong>
    </span>
  );
};
