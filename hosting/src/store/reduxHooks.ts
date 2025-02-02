import { TypedUseSelectorHook, useSelector } from "react-redux";
import { RootState } from ".";
import _ from 'lodash';

const compare = (left: unknown, right: unknown) => _.isEqual(left, right);

export const useAppSelector: TypedUseSelectorHook<RootState> = (selector, customCompare?) => useSelector(selector, customCompare || compare);